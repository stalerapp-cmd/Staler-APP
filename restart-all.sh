#!/bin/bash

echo "================================================"
echo "   🔄 RESTARTING ALL SERVICES"
echo "================================================"
echo ""

./stop-all.sh
echo ""
echo "⏳ Waiting 3 seconds..."
sleep 3
echo ""
./start-all.sh