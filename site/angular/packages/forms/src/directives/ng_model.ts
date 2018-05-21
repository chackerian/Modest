
import {Directive, EventEmitter, Host, Inject, Input, OnChanges, OnDestroy, Optional, Output, Self, SimpleChanges, forwardRef} from '@angular/core';

import {FormControl, FormHooks} from '../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../validators';

import {AbstractFormGroupDirective} from './abstract_form_group_directive';
import {ControlContainer} from './control_container';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from './control_value_accessor';
import {NgControl} from './ng_control';
import {NgForm} from './ng_form';
import {NgModelGroup} from './ng_model_group';
import {composeAsyncValidators, composeValidators, controlPath, isPropertyUpdated, selectValueAccessor, setUpControl} from './shared';
import {TemplateDrivenErrors} from './template_driven_errors';
import {AsyncValidator, AsyncValidatorFn, Validator, ValidatorFn} from './validators';

export const formControlBinding: any = {
  provide: NgControl,
  useExisting: forwardRef(() => NgModel)
};

const resolvedPromise = Promise.resolve(null);


@Directive({
  selector: '[ngModel]:not([formControlName]):not([formControl])',
  providers: [formControlBinding],
  exportAs: 'ngModel'
})
export class NgModel extends NgControl implements OnChanges,
    OnDestroy {
  public readonly control: FormControl = new FormControl();
  /** @internal */
  _registered = false;
  viewModel: any;

  @Input() name: string;
  @Input('disabled') isDisabled: boolean;
  @Input('ngModel') model: any;

  @Input('ngModelOptions') options: {name?: string, standalone?: boolean, updateOn?: FormHooks};

  @Output('ngModelChange') update = new EventEmitter();

  constructor(@Optional() @Host() parent: ControlContainer,
              @Optional() @Self() @Inject(NG_VALIDATORS) validators: Array<Validator|ValidatorFn>,
              @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<AsyncValidator|AsyncValidatorFn>,
              @Optional() @Self() @Inject(NG_VALUE_ACCESSOR)
              valueAccessors: ControlValueAccessor[]) {
                super();
                this._parent = parent;
                this._rawValidators = validators || [];
                this._rawAsyncValidators = asyncValidators || [];
                this.valueAccessor = selectValueAccessor(this, valueAccessors);
              }

              ngOnChanges(changes: SimpleChanges) {
                this._checkForErrors();
                if (!this._registered) this._setUpControl();
                if ('isDisabled' in changes) {
                  this._updateDisabled(changes);
                }

                if (isPropertyUpdated(changes, this.viewModel)) {
                  this._updateValue(this.model);
                  this.viewModel = this.model;
                }
              }

              ngOnDestroy(): void { this.formDirective && this.formDirective.removeControl(this); }

              get path(): string[] {
                return this._parent ? controlPath(this.name, this._parent) : [this.name];
              }

              get formDirective(): any { return this._parent ? this._parent.formDirective : null; }

              get validator(): ValidatorFn|null { return composeValidators(this._rawValidators); }

              get asyncValidator(): AsyncValidatorFn|null {
                return composeAsyncValidators(this._rawAsyncValidators);
              }

              viewToModelUpdate(newValue: any): void {
                this.viewModel = newValue;
                this.update.emit(newValue);
              }

              private _setUpControl(): void {
                this._setUpdateStrategy();
                this._isStandalone() ? this._setUpStandalone() :
                                       this.formDirective.addControl(this);
                this._registered = true;
              }

              private _setUpdateStrategy(): void {
                if (this.options && this.options.updateOn != null) {
                  this.control._updateOn = this.options.updateOn;
                }
              }

              private _isStandalone(): boolean {
                return !this._parent || !!(this.options && this.options.standalone);
              }

              private _setUpStandalone(): void {
                setUpControl(this.control, this);
                this.control.updateValueAndValidity({emitEvent: false});
              }

              private _checkForErrors(): void {
                if (!this._isStandalone()) {
                  this._checkParentType();
                }
                this._checkName();
              }

              private _checkParentType(): void {
                if (!(this._parent instanceof NgModelGroup) &&
                    this._parent instanceof AbstractFormGroupDirective) {
                  TemplateDrivenErrors.formGroupNameException();
                } else if (
                    !(this._parent instanceof NgModelGroup) && !(this._parent instanceof NgForm)) {
                  TemplateDrivenErrors.modelParentException();
                }
              }

              private _checkName(): void {
                if (this.options && this.options.name) this.name = this.options.name;

                if (!this._isStandalone() && !this.name) {
                  TemplateDrivenErrors.missingNameException();
                }
              }

              private _updateValue(value: any): void {
                resolvedPromise.then(
                    () => { this.control.setValue(value, {emitViewToModelChange: false}); });
              }

              private _updateDisabled(changes: SimpleChanges) {
                const disabledValue = changes['isDisabled'].currentValue;

                const isDisabled =
                    disabledValue === '' || (disabledValue && disabledValue !== 'false');

                resolvedPromise.then(() => {
                  if (isDisabled && !this.control.disabled) {
                    this.control.disable();
                  } else if (!isDisabled && this.control.disabled) {
                    this.control.enable();
                  }
                });
              }
}
