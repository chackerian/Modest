from tensorflow.python.estimator import estimator
from tensorflow.python.estimator import model_fn
from tensorflow.python.estimator.canned import head as head_lib
from tensorflow.python.estimator.canned import optimizers
from tensorflow.python.feature_column import feature_column as feature_column_lib
from tensorflow.python.layers import core as core_layers
from tensorflow.python.ops import init_ops
from tensorflow.python.ops import nn
from tensorflow.python.ops import partitioned_variables
from tensorflow.python.ops import variable_scope
from tensorflow.python.ops.losses import losses
from tensorflow.python.summary import summary
from tensorflow.python.util.tf_export import tf_export

# The default learning rate of 0.05 is a historical artifact of the initial
# implementation, but seems a reasonable choice.
_LEARNING_RATE = 0.05

def _add_hidden_layer_summary(value, tag):
  summary.scalar('%s/fraction_of_zero_values' % tag, nn.zero_fraction(value))
  summary.histogram('%s/activation' % tag, value)

def _dnn_logit_fn_builder(units, hidden_units, feature_columns, activation_fn,
                          dropout, input_layer_partitioner):
  if not isinstance(units, int):
    raise ValueError('units must be an int.  Given type: {}'.format(
        type(units)))

  def dnn_logit_fn(features, mode):

    with variable_scope.variable_scope(
        'input_from_feature_columns',
        values=tuple(six.itervalues(features)),
        partitioner=input_layer_partitioner):
      net = feature_column_lib.input_layer(
          features=features, feature_columns=feature_columns)
    for layer_id, num_hidden_units in enumerate(hidden_units):
      with variable_scope.variable_scope(
          'hiddenlayer_%d' % layer_id, values=(net,)) as hidden_layer_scope:
        net = core_layers.dense(
            net,
            units=num_hidden_units,
            activation=activation_fn,
            kernel_initializer=init_ops.glorot_uniform_initializer(),
            name=hidden_layer_scope)
        if dropout is not None and mode == model_fn.ModeKeys.TRAIN:
          net = core_layers.dropout(net, rate=dropout, training=True)
      _add_hidden_layer_summary(net, hidden_layer_scope.name)

    with variable_scope.variable_scope('logits', values=(net,)) as logits_scope:
      logits = core_layers.dense(
          net,
          units=units,
          activation=None,
          kernel_initializer=init_ops.glorot_uniform_initializer(),
          name=logits_scope)
    _add_hidden_layer_summary(logits, logits_scope.name)

    return logits

  return dnn_logit_fn


def _dnn_model_fn(features,
                  labels,
                  mode,
                  head,
                  hidden_units,
                  feature_columns,
                  optimizer='Adagrad',
                  activation_fn=nn.relu,
                  dropout=None,
                  input_layer_partitioner=None,
                  config=None):

  optimizer = optimizers.get_optimizer_instance(
      optimizer, learning_rate=_LEARNING_RATE)
  num_ps_replicas = config.num_ps_replicas if config else 0

  partitioner = partitioned_variables.min_max_variable_partitioner(
      max_partitions=num_ps_replicas)
  with variable_scope.variable_scope(
      'dnn',
      values=tuple(six.itervalues(features)),
      partitioner=partitioner):
    input_layer_partitioner = input_layer_partitioner or (
        partitioned_variables.min_max_variable_partitioner(
            max_partitions=num_ps_replicas,
            min_slice_size=64 << 20))

    logit_fn = _dnn_logit_fn_builder(
        units=head.logits_dimension,
        hidden_units=hidden_units,
        feature_columns=feature_columns,
        activation_fn=activation_fn,
        dropout=dropout,
        input_layer_partitioner=input_layer_partitioner)
    logits = logit_fn(features=features, mode=mode)

    return head.create_estimator_spec(
        features=features,
        mode=mode,
        labels=labels,
        optimizer=optimizer,
        logits=logits)


@tf_export('estimator.DNNClassifier')
class DNNClassifier(estimator.Estimator):

  def __init__(
      self,
      hidden_units,
      feature_columns,
      model_dir=None,
      n_classes=2,
      weight_column=None,
      label_vocabulary=None,
      optimizer='Adagrad',
      activation_fn=nn.relu,
      dropout=None,
      input_layer_partitioner=None,
      config=None,
      warm_start_from=None,
      loss_reduction=losses.Reduction.SUM,
  ):

    if n_classes == 2:
      head = head_lib._binary_logistic_head_with_sigmoid_cross_entropy_loss(  # pylint: disable=protected-access
          weight_column=weight_column,
          label_vocabulary=label_vocabulary,
          loss_reduction=loss_reduction)
    else:
      head = head_lib._multi_class_head_with_softmax_cross_entropy_loss(  # pylint: disable=protected-access
          n_classes, weight_column=weight_column,
          label_vocabulary=label_vocabulary,
          loss_reduction=loss_reduction)

    def _model_fn(features, labels, mode, config):
      """Call the defined shared _dnn_model_fn."""
      return _dnn_model_fn(
          features=features,
          labels=labels,
          mode=mode,
          head=head,
          hidden_units=hidden_units,
          feature_columns=tuple(feature_columns or []),
          optimizer=optimizer,
          activation_fn=activation_fn,
          dropout=dropout,
          input_layer_partitioner=input_layer_partitioner,
          config=config)

    super(DNNClassifier, self).__init__(
        model_fn=_model_fn, model_dir=model_dir, config=config,
        warm_start_from=warm_start_from)


@tf_export('estimator.DNNRegressor')
class DNNRegressor(estimator.Estimator):

  def __init__(
      self,
      hidden_units,
      feature_columns,
      model_dir=None,
      label_dimension=1,
      weight_column=None,
      optimizer='Adagrad',
      activation_fn=nn.relu,
      dropout=None,
      input_layer_partitioner=None,
      config=None,
      warm_start_from=None,
      loss_reduction=losses.Reduction.SUM,
  ):

    def _model_fn(features, labels, mode, config):
      """Call the defined shared _dnn_model_fn."""
      return _dnn_model_fn(
          features=features,
          labels=labels,
          mode=mode,
          head=head_lib.  # pylint: disable=protected-access
          _regression_head_with_mean_squared_error_loss(
              label_dimension=label_dimension, weight_column=weight_column,
              loss_reduction=loss_reduction),
          hidden_units=hidden_units,
          feature_columns=tuple(feature_columns or []),
          optimizer=optimizer,
          activation_fn=activation_fn,
          dropout=dropout,
          input_layer_partitioner=input_layer_partitioner,
          config=config)

    super(DNNRegressor, self).__init__(
        model_fn=_model_fn, model_dir=model_dir, config=config,
        warm_start_from=warm_start_from)