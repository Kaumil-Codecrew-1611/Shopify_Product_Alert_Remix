import { useLoaderData, useNavigate } from '@remix-run/react';
import { Card, FullscreenBar, Icon, Layout, Page, Pagination, Tooltip, Text } from '@shopify/polaris';
import { useState } from 'react';
import { authenticate, apiVersion } from "../shopify.server";
import { InfoIcon } from '@shopify/polaris-icons';
import prisma from '../server/db.server';

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;
    try {
        const emailConfig = await prisma.emailConfiguration.findFirst({ where: { shop } });
        console.log(emailConfig, "emailConfig")
        // Fetch products from Shopify API with pagination parameters
        const response = await fetch(`https://${shop}/admin/api/${apiVersion}/products.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });

        const data = await response.json();
        // Process and filter data as needed
        const filteredData = data.products.filter(item => (item.handle !== "gift-card") && item.variants.some(node => node.inventory_quantity < emailConfig.threshold)).map(item => ({ ...item, variants: item.variants.filter(node => node.inventory_quantity < emailConfig.threshold) }));

        const groupedVariants = filteredData.reduce((acc, product) => {
            product.variants.forEach((variant) => {
                if (!acc[variant.product_id]) {
                    acc[variant.product_id] = [];
                }
                acc[variant.product_id].push(variant);
            });
            return acc;
        }, {});

        return { products: filteredData, groupedVariants, emailConfig };
    } catch (err) {
        console.log(err, "emailConfig")
        return err;
    }
};

const Products = () => {
    const { products, groupedVariants, emailConfig } = useLoaderData();
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 5;
    const totalData = Object.keys(groupedVariants).length
    const totalPages = Math.ceil(totalData / perPage);
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const visibleVariants = Object.values(groupedVariants).slice(startIndex, endIndex);
    const renderIndex = (vIndex) => {
        return startIndex + vIndex + 1;
    };
    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <FullscreenBar onAction={() => navigate('/app')}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Text variant="headingLg">Products</Text>
                                <Tooltip content={`Products and it's variants with quantities below the threshold (${emailConfig.threshold})`}>
                                    <Icon source={InfoIcon} />
                                </Tooltip>
                            </div>
                        </div>
                    </FullscreenBar>
                </Layout.Section>
                <Layout.Section>
                    <Card>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Sr. No</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Product id</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Product Title</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Product Image</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Variant Title</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Quantity</th>
                                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleVariants.map((variants, index) => {
                                    const product = products.find((product) => product.variants[0].product_id === variants[0].product_id);
                                    const { id, title, images } = product;
                                    const productImage = images[0]?.src;

                                    return variants.map((variant, vIndex) => (
                                        <tr key={`${id}-${variant.id}`}>
                                            {vIndex === 0 && (
                                                <>
                                                    <td rowSpan={variants.length} style={{ border: '1px solid #ccc', padding: '8px', textAlign: "end" }}>{renderIndex(index)}</td>
                                                    <td rowSpan={variants.length} style={{ border: '1px solid #ccc', padding: '8px', textAlign: "end" }}>{id}</td>
                                                    <td rowSpan={variants.length} style={{ border: '1px solid #ccc', padding: '8px' }}>{title}</td>
                                                    <td rowSpan={variants.length} style={{ border: '1px solid #ccc', padding: '8px' }}>
                                                        {productImage && <img src={productImage} alt={title} style={{ borderRadius: '50%', width: '60px', height: '60px' }} />}
                                                    </td>
                                                </>
                                            )}
                                            <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                                                {variant.title == "Default Title" ? "-" : variant.title}
                                            </td>
                                            <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 700, color: variant.inventory_quantity === 0 ? 'red' : 'black', textAlign: "end" }}>{variant.inventory_quantity}</td>
                                            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: "end" }}>{variant.price}</td>
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </Card>
                    <div style={{ marginTop: 10, float: 'right' }}>
                        <Pagination
                            type='page'
                            label={`${currentPage} - ${totalPages} of ${totalData} products`}
                            hasPrevious={currentPage > 1}
                            onPrevious={() => handlePageChange(currentPage - 1)}
                            hasNext={currentPage < totalPages}
                            onNext={() => handlePageChange(currentPage + 1)}
                        />
                    </div>
                </Layout.Section>
            </Layout>
        </Page>
    );
};

export default Products;