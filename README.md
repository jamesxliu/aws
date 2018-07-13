Scratch code, parts can probably be repurposed into boilerplate for lightweight Form-UI-driven nodeJS-backed apps intended
to spawn children processes. Could probably also use built-in child process forking support for pub/sub if you wanted to.

The gist of it: https://medium.com/@NorbertdeLangen/communicating-between-nodejs-processes-4e68be42b917

To deploy to AWS you'd wanna get Go & Primitive installed & accessible in the path of the ec2 user first. Then use something
like `iptables` to map `80:8080` so visitors can access the static webserver directly via instance IP.