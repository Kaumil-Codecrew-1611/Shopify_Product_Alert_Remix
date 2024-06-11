import { useLoaderData } from '@remix-run/react';
import { Card, Layout, Page } from '@shopify/polaris';
import { useEffect } from 'react';
import { authenticate, apiVersion } from "../shopify.server";


export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;
    try {
        const emailConfig = await prisma.emailConfiguration.findFirst({ where: { shop } });
        const response = await fetch(`https://${shop}/admin/api/${apiVersion}/products.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });
        const data = await response.json()

        const filteredData = await data.products.filter(item => (item.handle !== "gift-card") && item.variants.some(node => node.inventory_quantity < emailConfig.threshold)).map(item => ({ ...item, variants: item.variants.filter(node => node.inventory_quantity < emailConfig.threshold) }))

        const groupedVariants = filteredData.reduce((acc, product) => {
            product.variants.forEach((variant) => {
                if (!acc[variant.product_id]) {
                    acc[variant.product_id] = [];
                }
                acc[variant.product_id].push(variant);
            });
            return acc;
        }, {});
        console.log(filteredData, "filteredData")
        return { products: filteredData, groupedVariants };
    } catch (err) {
        return err;
    }
};

const Products = () => {
    const { products, groupedVariants } = useLoaderData();

    useEffect(() => {
        console.log(products, 'products');
    }, [products]);
    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <Card>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sr. No</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Product Title</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Product Image</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Variant Title & Image</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Quantity</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(groupedVariants).map((variants, index) => {

                                    const { id, title, images } = products.find((product) => product.variants[0].product_id === variants[0].product_id);
                                    const productImage = images[0]?.src;

                                    return variants.map((variant, vIndex) => (
                                        <tr key={`${id}-${variant.id}`}>
                                            {vIndex === 0 && (
                                                <>
                                                    <td rowSpan={variants.length} style={{ border: '1px solid #ccc', padding: '8px' }}>{id}</td>
                                                    <td rowSpan={variants.length} style={{ border: '1px solid #ccc', padding: '8px' }}>{title}</td>
                                                    <td rowSpan={variants.length} style={{ border: '1px solid #ccc', padding: '8px' }}>
                                                        {productImage && <div style={{ display: 'flex', justifyContent: 'center', flexGrow: 1 }}><img src={productImage} alt={title} style={{ borderRadius: '50%', width: '60px', height: '60px' }} /></div>}
                                                    </td>
                                                </>
                                            )}
                                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                                                {variant.image && <img src={variant.image.originalSrc} alt={variant.title} style={{ borderRadius: '50%', width: '30px', height: '30px', marginRight: '8px' }} />}
                                                {variant.title}
                                            </td>
                                            <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 700, color: variant.inventory_quantity == 0 ? 'red' : 'black' }}>{variant.inventory_quantity}</td>
                                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>{variant.price}</td>
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
    /*     return (
            <Page>
                <Layout>
                    <Layout.Section>
                        <Card>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sr. No</th>
                                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Product Title</th>
                                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Product Image</th>
                                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Variant Title</th>
                                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Quantity</th>
                                        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product, index) => {
                                        const { node } = product;
                                        const { id, title, description, images, variants } = node;
                                        const productImage = images.edges[0]?.node.originalSrc;
    
                                        return variants.edges.map((variant, vIndex) => {
                                            const { node: variantNode } = variant;
                                            const variantTitle = variantNode.title;
                                            const quantity = variantNode.inventoryQuantity;
                                            const variantImage = variantNode.image?.originalSrc;
                                            const price = variantNode.price;
                                            console.log(variantNode, ":::variantNode")
                                            return (
                                                <tr key={`${id}-${variantNode.id}`}>
                                                    {vIndex === 0 && (
                                                        <>
                                                            <td rowSpan={variants.edges.length} style={{ border: '1px solid #ccc', padding: '8px' }}>{index + 1}</td>
                                                            <td rowSpan={variants.edges.length} style={{ border: '1px solid #ccc', padding: '8px' }}>{title}</td>
                                                            <td rowSpan={variants.edges.length} style={{ border: '1px solid #ccc', padding: '8px' }}>
                                                                {productImage && <Thumbnail source={productImage} alt={title} size="small" />}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{variantTitle}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{quantity}</td>
                                                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{price}</td>
                                                </tr>
                                            );
                                        });
                                    })}
                                </tbody>
                            </table>
                        </Card>
                    </Layout.Section>
                </Layout>
            </Page>
        ); */
};

export default Products;
