import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "admin_backend_bundle/**", "admin_frontend_remote_bundle/**"],
  },
]

export default eslintConfig
