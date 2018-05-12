import { Client } from 'ssh2';

export function runSSHCommand(info, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    const sshAgent = process.env.SSH_AUTH_SOCK;
    const ssh = {
      host: info.host,
      port: (info.opts && info.opts.port) || 22,
      username: info.username
    };
    
    ssh.privateKey = fs.readFileSync(resolvePath(info.pem), 'utf8');
    
    conn.connect(ssh);

    conn.once('ready', () => {
      conn.exec(command, (err, outputStream) => {

        let output = '';

        outputStream.on('data', data => {
          output += data;
        });

        outputStream.once('close', code => {
          conn.end();
          resolve({ code, output, host: info.host });
        });
      });
    });
  });
}

// sudo mkdir -p /opt/mongodb
// sudo docker pull mongo:$MONGO_VERSION
// sudo docker update --restart=no mongodb
// sudo docker exec mongodb mongod --shutdown
// sleep 2
// sudo docker rm -f mongodb

// sudo docker run \
//   -d \
//   --restart=always \
//   --publish=127.0.0.1:27017:27017 \
//   --volume=<%= mongoDbDir %>:/data/db \
//   --volume=/opt/mongodb/mongodb.conf:/mongodb.conf \
//   --name=mongodb \
//   mongo:$MONGO_VERSION mongod -f /mongodb.conf

// limit=20
// elaspsed=0

// while [[ true ]]; do
//   sleep 1
//   sudo docker exec mongodb mongo --eval \
//     'rs.initiate({_id: "meteor", members: [{_id: 0, host: "127.0.0.1:27017"}]});' \
//     && exit 0
// done