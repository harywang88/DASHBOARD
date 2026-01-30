# Use Node.js with Debian for installing conversion tools
FROM node:20-bookworm-slim

# Install conversion tools
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    libreoffice \
    ghostscript \
    p7zip-full \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Fix ImageMagick policy for PDF
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml || true

# Create symlink for magick command (Debian uses 'convert' instead of 'magick')
RUN ln -sf /usr/bin/convert /usr/bin/magick || true

# Verify tools are installed
RUN ffmpeg -version && convert --version && soffice --version && 7z || true

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
