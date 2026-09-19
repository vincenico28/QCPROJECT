# ==============================================================================
# QC Flow Guardian - Web Application & SSR Server (TanStack Start + Nitro)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install libc compatibility for native bindings
RUN apk add --no-cache libc6-compat

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --no-audit

# Copy application source code
COPY . .

# Build-time environment variables for Vite static client bundle
ARG VITE_AI_SERVICE_URL="https://ai-detection-back-end.hostforgeplatforms.com"
ARG VITE_SUPABASE_URL="https://wcprajgotifqgwdjnpss.supabase.co"
ARG VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Xw_6U8zHYrNcuU--0tbbmQ_QTDbsQew"
ARG VITE_SUPABASE_PROJECT_ID="wcprajgotifqgwdjnpss"

ENV VITE_AI_SERVICE_URL=${VITE_AI_SERVICE_URL} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY} \
    VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID} \
    NITRO_PRESET=node-server \
    NODE_ENV=production

RUN npm run build

# ==============================================================================
# Production Runner Stage (Minimal & Secure)
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Run as non-root node user
USER node

# Copy standalone output directory from builder stage
COPY --chown=node:node --from=builder /app/.output ./.output

# Expose web application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

# Start standalone Node server
CMD ["node", ".output/server/index.mjs"]
