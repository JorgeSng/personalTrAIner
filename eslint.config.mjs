import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  { ignores: ["coverage/**", ".next/**"] },
  ...nextCoreWebVitals,
];

export default eslintConfig;
