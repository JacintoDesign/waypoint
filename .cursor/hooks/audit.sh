#!/bin/bash
json_input=$(cat)
echo "[$(date '+%F %T')] $json_input" >> /tmp/agent-audit.log
exit 0