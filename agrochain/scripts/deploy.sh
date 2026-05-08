#!/bin/bash
# ===========================================
# AgroChain Ukraine — Deploy Script
# Server: vmi2996072.contaboserver.net (75.119.131.94)
# Domain: agrochain-ukraine.org
# ===========================================
set -e

SERVER="root@vmi2996072.contaboserver.net"
PROJECT_DIR="/opt/agrochain"
DOMAIN="agrochain-ukraine.org"

echo "🚀 Deploying AgroChain Ukraine to $SERVER..."
echo "🔍 Using ports: Backend=8010, Frontend=3001, DB=5434"
echo ""

# 1. Sync project files to server
echo "📦 Syncing project files..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='__pycache__' \
    --exclude='*.pyc' --exclude='.env' --exclude='target/' \
    ./ $SERVER:$PROJECT_DIR/

# 2. Setup nginx config on server
echo "🌐 Setting up Nginx config for $DOMAIN..."
ssh $SERVER "cat > /etc/nginx/sites-available/agrochain-ukraine.org << 'NGINX'
# AgroChain Ukraine — HTTP to HTTPS redirect
server {
    listen 80;
    server_name agrochain-ukraine.org www.agrochain-ukraine.org;
    return 301 https://agrochain-ukraine.org\$request_uri;
}

# AgroChain Ukraine — HTTPS
server {
    listen 443 ssl;
    server_name agrochain-ukraine.org www.agrochain-ukraine.org;

    ssl_certificate /etc/letsencrypt/live/agrochain-ukraine.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agrochain-ukraine.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8010/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # FastAPI Docs (optional — disable in production)
    location /docs {
        proxy_pass http://127.0.0.1:8010/docs;
        proxy_set_header Host \$host;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8010/openapi.json;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8010/health;
    }

    # Frontend (React SPA)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
NGINX"

# 3. Enable nginx site
echo "✅ Enabling nginx site..."
ssh $SERVER "ln -sf /etc/nginx/sites-available/agrochain-ukraine.org /etc/nginx/sites-enabled/agrochain-ukraine.org"

# 4. Test nginx config
echo "🔧 Testing nginx config..."
ssh $SERVER "nginx -t"

# 5. Build and start Docker containers
echo "🐳 Building Docker containers..."
ssh $SERVER "cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml build --no-cache"

echo "🚀 Starting containers..."
ssh $SERVER "cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml up -d"

# 6. SSL Certificate with Let's Encrypt (first deploy only)
echo "🔐 Setting up SSL..."
ssh $SERVER "certbot --nginx -d agrochain-ukraine.org -d www.agrochain-ukraine.org --non-interactive --agree-tos --email logisticstoukraine@gmail.com || echo 'SSL already exists or domain not pointed to server yet'"

# 7. Reload nginx
echo "🔄 Reloading nginx..."
ssh $SERVER "systemctl reload nginx"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend: https://agrochain-ukraine.org"
echo "🔧 API Docs: https://agrochain-ukraine.org/docs"
echo "💚 Health:   https://agrochain-ukraine.org/health"
echo ""
echo "📊 Container status:"
ssh $SERVER "docker ps --filter name=agrochain"
