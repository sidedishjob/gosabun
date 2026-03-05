import nextConfig from "eslint-config-next"
import coreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier"

const eslintConfig = [...nextConfig, ...coreWebVitals, ...nextTypescript, prettier]

export default eslintConfig
