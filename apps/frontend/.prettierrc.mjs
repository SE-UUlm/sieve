import rootConfig from "../../.prettierrc.mjs";

const config = {
    ...rootConfig,
    "plugins": ["prettier-plugin-tailwindcss"]
}

export default config
