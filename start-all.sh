
#!/bin/bash

echo "================================================"
echo "   🚀 STARTING STALER PROJECT (WITH NGINX FIX)"
echo "================================================"
echo ""


echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🔧 STEP 0: Configuring Nginx Upload Limits"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

UPLOAD_CONF="/etc/nginx/conf.d/staler-uploads.conf"

if [ ! -f "$UPLOAD_CONF" ]; then
  echo "📝 Creating Nginx upload configuration..."
  sudo bash -c "cat > $UPLOAD_CONF" << 'EOF'
# S-Taler Upload Configuration
client_max_body_size 200M;
client_body_timeout 300s;
client_header_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
EOF
  echo "✅ Nginx upload config created"
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx 2>/dev/null
    echo "✅ Nginx reloaded with new config"
  else
    echo "⚠️  Nginx config test failed, but continuing..."
  fi
else
  echo "✅ Nginx upload config already exists"
fi

echo ""



echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🔄 STEP 0.5: Starting pgBouncer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo systemctl start pgbouncer
sleep 2

if sudo systemctl is-active --quiet pgbouncer; then
  echo "✅ pgBouncer running"
else
  echo "⚠️  pgBouncer not running, trying restart..."
  sudo systemctl restart pgbouncer
  sleep 2
  if sudo systemctl is-active --quiet pgbouncer; then
    echo "✅ pgBouncer running"
  else
    echo "❌ pgBouncer failed to start!"
    sudo systemctl status pgbouncer
    exit 1
  fi
fi

echo ""



echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🌐 STEP 1: Setting up Zrok Links"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

LINKS_FILE="$HOME/zrok-links.txt"

echo "🔑 Enabling Zrok..."
zrok disable 2>/dev/null
sleep 1
zrok enable 11cBsiQOxbUM
echo ""

echo "🛑 Stopping old Zrok processes..."
pkill -f "zrok share" 2>/dev/null
sleep 2
echo ""

get_zrok_link() {
  local port=$1
  local log_file=$2
  local service_name=$3

  echo "📡 Starting Zrok for $service_name (port $port)..." >&2
  rm -f "$log_file"
  zrok share public http://localhost:$port --headless > "$log_file" 2>&1 &
  local pid=$!

  local waited=0
  local url=""

  while [ $waited -lt 30 ]; do
    sleep 2
    waited=$((waited + 2))
    url=$(grep -oP 'https://[a-z0-9]+\.share\.zrok\.io' "$log_file" 2>/dev/null | head -1)
    if [ ! -z "$url" ]; then
      echo "✅ $service_name URL: $url" >&2
      echo "$pid" >> /tmp/zrok-pids.txt
      echo "$url"
      return 0
    fi
    echo -n "." >&2
  done

  echo "" >&2
  echo "❌ Failed to get $service_name URL" >&2
  return 1
}

> /tmp/zrok-pids.txt

BANK_URL=$(get_zrok_link 8083 /tmp/zrok-bank.log "Bank")
echo ""
sleep 3

FRONTEND_URL=$(get_zrok_link 80 /tmp/zrok-frontend.log "Frontend/Backend")
echo ""
sleep 3

EXCHANGE_URL=$(get_zrok_link 8081 /tmp/zrok-exchange.log "Exchange")
echo ""

if [ -z "$BANK_URL" ] || [ -z "$FRONTEND_URL" ] || [ -z "$EXCHANGE_URL" ]; then
  echo "❌ Failed to get all URLs!"
  exit 1
fi

cat > "$LINKS_FILE" << EOF
BANK_URL=$BANK_URL
FRONTEND_URL=$FRONTEND_URL
EXCHANGE_URL=$EXCHANGE_URL
EOF

echo "✅ Zrok links saved!"
echo "   Bank:     $BANK_URL"
echo "   Frontend: $FRONTEND_URL"
echo "   Exchange: $EXCHANGE_URL"
echo ""



echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📝 STEP 2: Updating Configuration Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 Updating frontend/.env..."
FRONTEND_ENV="$HOME/staler-project/frontend/.env"
[ -f "$FRONTEND_ENV" ] && cp "$FRONTEND_ENV" "${FRONTEND_ENV}.backup"

cat > "$FRONTEND_ENV" << EOF
REACT_APP_BANK_URL=${BANK_URL}/bank
REACT_APP_API_URL=${FRONTEND_URL}/api
WDS_SOCKET_PORT=0
WDS_SOCKET_PATH=/ws
EOF

if grep -q "$BANK_URL" "$FRONTEND_ENV"; then
  echo "✅ Frontend .env updated"
else
  echo "❌ Frontend .env failed!"
  exit 1
fi
echo ""

echo "📝 Updating backend/.env..."
BACKEND_ENV="$HOME/staler-project/backend/.env"

if [ -f "$BACKEND_ENV" ]; then
  cp "$BACKEND_ENV" "${BACKEND_ENV}.backup"
  if grep -q "TALER_BANK_URL" "$BACKEND_ENV"; then
    sed -i "s|TALER_BANK_URL=.*|TALER_BANK_URL=${BANK_URL}|g" "$BACKEND_ENV"
    sed -i "s|TALER_EXCHANGE_URL=.*|TALER_EXCHANGE_URL=${EXCHANGE_URL}|g" "$BACKEND_ENV"
  else
    echo "" >> "$BACKEND_ENV"
    echo "TALER_BANK_URL=${BANK_URL}" >> "$BACKEND_ENV"
    echo "TALER_EXCHANGE_URL=${EXCHANGE_URL}" >> "$BACKEND_ENV"
  fi
  echo "✅ Backend .env updated"
else
  echo "⚠️  Backend .env not found"
fi
echo ""

echo "📝 Updating Exchange config..."
EXCHANGE_CONF="/usr/local/etc/taler/taler-exchange.conf"
sudo cp "$EXCHANGE_CONF" "${EXCHANGE_CONF}.backup"

TEMP_CONF=$(mktemp)
sudo cat "$EXCHANGE_CONF" > "$TEMP_CONF"

if grep -q "^BASE_URL = " "$TEMP_CONF"; then
  sed -i "s|^BASE_URL = .*|BASE_URL = ${EXCHANGE_URL}/|g" "$TEMP_CONF"
else
  sed -i "/^\[exchange\]/a BASE_URL = ${EXCHANGE_URL}/" "$TEMP_CONF"
fi

if ! grep -q "^WIRE_GATEWAY_URL = " "$TEMP_CONF"; then
  sed -i "/^BASE_URL = /a WIRE_GATEWAY_URL = http://localhost:8080/accounts/exchange/taler-wire-gateway/" "$TEMP_CONF"
fi

sudo cp "$TEMP_CONF" "$EXCHANGE_CONF"
rm -f "$TEMP_CONF"

echo "🔍 Verifying Exchange config..."
if sudo grep -q "$EXCHANGE_URL" "$EXCHANGE_CONF"; then
  echo "✅ Exchange config updated successfully"
else
  echo "❌ Exchange config verification failed!"
  exit 1
fi
echo ""



echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🔨 STEP 3: Building Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd ~/staler-project/frontend
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Frontend built successfully"
else
  echo "❌ Frontend build failed"
  exit 1
fi
echo ""



echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🛑 STEP 4: Stopping Old Processes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sudo fuser -k 5000/tcp 2>/dev/null
sudo fuser -k 8080/tcp 2>/dev/null
pkill -f "taler-exchange-httpd" 2>/dev/null
pkill -f "libeufin-bank" 2>/dev/null
pkill -f "bank-proxy" 2>/dev/null
pkill -f "run-wirewatch" 2>/dev/null
pkill -f "run-aggregator" 2>/dev/null
pkill -f "node.*staler-project/backend" 2>/dev/null
sleep 3
echo "✅ Old processes stopped"
echo ""



echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ▶️  STEP 5: Starting All Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔧 Starting Bank Proxy..."
nohup python3 ~/bank-proxy.py > /tmp/bank-proxy.log 2>&1 &
sleep 2

echo "🏦 Starting Bank..."
nohup ~/libeufin/bank/build/install/bank-shadow/bin/libeufin-bank serve \
  -c ~/bank.conf > /tmp/libeufin.log 2>&1 &
BANK_PID=$!
sleep 5

if ps -p $BANK_PID > /dev/null; then
  echo "✅ Bank running (PID: $BANK_PID)"
else
  echo "❌ Bank failed to start"
  tail -20 /tmp/libeufin.log
  exit 1
fi
echo ""

echo "🔧 Starting Backend..."
cd ~/staler-project/backend
nohup npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 5

if ps -p $BACKEND_PID > /dev/null; then
  echo "✅ Backend running (PID: $BACKEND_PID)"
else
  echo "❌ Backend failed to start"
  tail -20 /tmp/backend.log
  exit 1
fi
echo ""

echo "💱 Starting Exchange..."
nohup taler-exchange-httpd -c /usr/local/etc/taler/taler-exchange.conf -L INFO > /tmp/exchange.log 2>&1 &
EXCHANGE_PID=$!
sleep 3

if ps -p $EXCHANGE_PID > /dev/null; then
  echo "✅ Exchange running (PID: $EXCHANGE_PID)"
else
  echo "❌ Exchange failed to start"
  tail -20 /tmp/exchange.log
  exit 1
fi
echo ""

echo "🔄 Starting Wirewatch & Aggregator..."
nohup bash ~/run-wirewatch.sh > /dev/null 2>&1 &
nohup bash ~/run-aggregator.sh > /dev/null 2>&1 &
echo "✅ Wirewatch & Aggregator started"
echo ""

echo "🌐 Restarting Nginx..."
sudo systemctl restart nginx
sleep 2

if sudo systemctl is-active --quiet nginx; then
  echo "✅ Nginx running"
else
  echo "❌ Nginx failed"
  sudo systemctl status nginx
  exit 1
fi
echo ""

cat > /tmp/staler-pids.txt << EOF
BANK_PID=$BANK_PID
BACKEND_PID=$BACKEND_PID
EXCHANGE_PID=$EXCHANGE_PID
EOF



echo "================================================"
echo "   ✅ ALL SERVICES RUNNING!"
echo "================================================"
echo ""
echo "🌐 PUBLIC URLs (Share These):"
echo "   🏦 Bank:              ${BANK_URL}/webui/#"
echo "   🌐 Frontend/Backend:  ${FRONTEND_URL}"
echo "   💱 Exchange:          ${EXCHANGE_URL}"
echo ""
echo "💻 LOCAL URLs:"
echo "   http://localhost       - Nginx (All)"
echo "   http://localhost/api   - Backend API"
echo "   http://localhost:8080  - Bank"
echo "   http://localhost:8081  - Exchange"
echo ""
echo "✅ Nginx configured for large uploads (200MB)"
echo ""
echo "📝 Configuration Files:"
echo "   Frontend .env: ~/staler-project/frontend/.env"
echo "   Backend .env:  ~/staler-project/backend/.env"
echo "   Exchange conf: /usr/local/etc/taler/taler-exchange.conf"
echo "   Nginx upload:  /etc/nginx/conf.d/staler-uploads.conf"
echo ""
echo "📊 Logs:"
echo "   tail -f /tmp/backend.log"
echo "   tail -f /tmp/exchange.log"
echo "   tail -f /tmp/libeufin.log"
echo "   tail -f /tmp/wirewatch.log"
echo ""
echo "🛑 Stop:    ./stop-all.sh"
echo "🔄 Restart: ./restart-all.sh"
echo "📊 Status:  ./status-all.sh"
echo "================================================"