#!/bin/bash

echo "================================================"
echo "   📊 PROJECT STATUS"
echo "================================================"
echo ""

if [ -f "$HOME/zrok-links.txt" ]; then
  source "$HOME/zrok-links.txt"
  echo "🌐 Zrok URLs:"
  echo "   Bank:              $BANK_URL"
  echo "   Frontend/Backend:  $FRONTEND_URL"
  echo "   Exchange:          $EXCHANGE_URL"
else
  echo "⚠️  No Zrok links found"
fi
echo ""

echo "🔍 Process Status:"

ZROK_COUNT=$(ps aux | grep -v grep | grep "zrok share" | wc -l)
[ $ZROK_COUNT -gt 0 ] && echo "   ✅ Zrok:     Running ($ZROK_COUNT)" || echo "   ❌ Zrok:     Not running"

pgrep -f "libeufin-bank" > /dev/null && echo "   ✅ Bank:     Running" || echo "   ❌ Bank:     Not running"

pgrep -f "node.*staler-project/backend" > /dev/null && echo "   ✅ Backend:  Running" || echo "   ❌ Backend:  Not running"

pgrep -f "taler-exchange-httpd" > /dev/null && echo "   ✅ Exchange: Running" || echo "   ❌ Exchange: Not running"

sudo systemctl is-active --quiet nginx && echo "   ✅ Nginx:    Running" || echo "   ❌ Nginx:    Not running"

echo ""
echo "🌐 Health Checks:"

curl -s http://localhost:5000 > /dev/null 2>&1 && echo "   ✅ Backend:  OK" || echo "   ❌ Backend:  DOWN"
curl -s http://localhost:8080/config > /dev/null 2>&1 && echo "   ✅ Bank:     OK" || echo "   ❌ Bank:     DOWN"
curl -s http://localhost:8081/keys > /dev/null 2>&1 && echo "   ✅ Exchange: OK" || echo "   ❌ Exchange: DOWN"
curl -s http://localhost > /dev/null 2>&1 && echo "   ✅ Nginx:    OK" || echo "   ❌ Nginx:    DOWN"

echo ""
echo "================================================"