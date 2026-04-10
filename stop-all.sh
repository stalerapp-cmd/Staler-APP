
echo "================================================"
echo "   🛑 STOPPING ALL SERVICES"
echo "================================================"
echo ""

echo "🌐 Stopping Zrok..."
if [ -f /tmp/zrok-pids.txt ]; then
  while read pid; do
    kill $pid 2>/dev/null
  done < /tmp/zrok-pids.txt
  rm -f /tmp/zrok-pids.txt
fi
pkill -f "zrok share" 2>/dev/null
echo "✅ Zrok stopped"
echo ""

echo "🔧 Stopping Backend..."
sudo fuser -k 5000/tcp 2>/dev/null
pkill -f "node.*staler-project/backend" 2>/dev/null
echo "✅ Backend stopped"
echo ""

echo "🏦 Stopping Bank..."
sudo fuser -k 8080/tcp 2>/dev/null
pkill -f "libeufin-bank" 2>/dev/null
echo "✅ Bank stopped"
echo ""

echo "💱 Stopping Exchange..."
pkill -f "taler-exchange-httpd" 2>/dev/null
echo "✅ Exchange stopped"
echo ""

rm -f /tmp/staler-pids.txt
rm -f /tmp/zrok-pids.txt

echo "ℹ️  Nginx still running (use: sudo systemctl stop nginx)"
echo ""
echo "================================================"
echo "   ✅ ALL SERVICES STOPPED"
echo "================================================"