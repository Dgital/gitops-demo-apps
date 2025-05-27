FROM envoyproxy/envoy:v1.33-latest

COPY src/envoy.yaml /etc/envoy/envoy.yaml
COPY src/set-header.lua /etc/envoy/set-header.lua

EXPOSE 10000
EXPOSE 10001
EXPOSE 10002
