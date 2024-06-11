import { apiVersion } from "../../shopify.server";
import prisma from "../db.server";

const fetchProductWithVariant = async (shop, accessToken) => {
    const emailConfig = await prisma.emailConfiguration.findFirst({ where: { shop } });
    if (!emailConfig) return "Email is not configure";
    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/products.json`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        }
    });
    const data = await response.json()

    const filteredData =
        await data.products.filter(item => (item.handle !== "gift-card") && item.variants.some(node => node.inventory_quantity < emailConfig.threshold))
            .map(item => ({ ...item, variants: item.variants.filter(node => node.inventory_quantity < emailConfig.threshold) }))

    const groupedVariants = filteredData.reduce((acc, product) => {
        product.variants.forEach((variant) => {
            if (!acc[variant.product_id]) {
                acc[variant.product_id] = [];
            }
            acc[variant.product_id].push(variant);
        });
        return acc;
    }, {});
    return { filteredData, groupedVariants }
}

export default fetchProductWithVariant