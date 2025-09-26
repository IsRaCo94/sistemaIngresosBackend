FROM node:16-bullseye

# Instalar dependencias necesarias y LibreOffice + fuentes básicas
RUN apt-get update \
  && apt-get install -y \
    libreoffice \
    fontconfig \
    fonts-dejavu \
    fonts-liberation \
    ghostscript \
  && rm -rf /var/lib/apt/lists/*

# Verificar instalación de LibreOffice
RUN libreoffice --version

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000
# ... otras instrucciones ...

# Asegurar que Carbone/libreoffice-convert encuentren LibreOffice
ENV SOFFICE_BIN=/usr/bin/soffice \
    LIBREOFFICE_PATH=/usr/bin/libreoffice \
    CARBONE_LO_PATH=/usr/bin/soffice \
    PATH="/usr/bin:$PATH" \
    HOME=/tmp

# Comando para iniciar la aplicación
CMD ["npm", "run", "start"]