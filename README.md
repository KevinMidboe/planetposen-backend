# planetposen backend

Backend api of planetposen webshop. View frontend at: [kevinmidboe/planetposen-frontend](https://github.com/kevinmidboe/planetposen-frontend)

Also uses the following supplementary go apps:
 - image proxy  : [kevinmidboe/planetposen-images](https://github.com/kevinmidboe/planetposen-image)
 - email sender : [kevinmidboe/planetposen-mail](https://github.com/kevinmidboe/planetposen-mail)

## Install

Download project:

```bash
git clone https://github.com/kevinmidboe/planetposen-backend
cd planetposen-backend
```

Install dependencies:
```bash
yarn
```

or

```bash
npm install
```

Copy default configuration files:
```bash
cp config/default/* config/env
```

Update values in configuration files for both development & production

## Build
To compile typescript files to javascript build project by running:

```bash
yarn build:ts
```

## Developing

Start application with development configuration:

```bash
yarn dev
```

Api will be available at: http://localhost:30010

