#!/bin/bash
# run as superuser
iptables -A PREROUTING -t nat -p tcp --dport 80 -j REDIRECT --to-ports 8080
