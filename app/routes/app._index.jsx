import { useLoaderData } from '@remix-run/react';
import { Box, Card, EmptyState, Layout, Page, Text, Spinner, Button } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import { apiVersion, authenticate } from '../shopify.server';
import prisma from '../server/db.server';
import Logo from '../assets/images/11.png'
import Banner from '../assets/images/7.png'
export const loader = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);
        let shop, accessToken;
        if (!session) {
            await prisma.session.deleteMany()
            throw new Error('Authentication Failed!');
        } else {
            shop = session.shop
            accessToken = session.accessToken
        }
        const responseOfShop = await fetch(`https://${shop}/admin/api/${apiVersion}/shop.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });

        if (!responseOfShop.ok) {
            throw new Error(`Failed to fetch shop details: ${responseOfShop.status} ${responseOfShop.statusText}`);
        }

        const shopDetails = await responseOfShop.json();
        console.log(shopDetails, "shopDetails");
        return { shopDetails };
    } catch (error) {
        console.log(error, "ErrorResponse");
        return { error: error.message };
    }
};

const Index = () => {
    const data = useLoaderData();
    const [shopDetails, setShopDetails] = useState({});
    const [loading, setLoading] = useState(true);
    // const navigate = useNavigate()
    useEffect(() => {
        if (data.error) {
            // Handle case where loader function encountered an error
            setLoading(false); // Stop loading indicator
            return; // Exit early to prevent further execution
        }
        const shop = data?.shopDetails?.shop;
        const name = shop?.shop_owner;
        const email = shop?.email;
        const payload = {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            email
        };
        setShopDetails(payload);
        setLoading(false); // Set loading to false once data is fetched and processed
    }, [data]);

    const greetings = () => {
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 12) {
            return 'Morning';
        } else if (currentHour >= 12 && currentHour < 18) {
            return 'Afternoon';
        } else {
            return 'Evening';
        }
    };

    return (
        <Page>
            <Layout>
                {data.error ? (
                    <Box style={{ textAlign: 'center', width: '100%' }}>
                        <Text as="h1" variant="headingXl" style={{ color: 'red' }}>
                            Authentication Failed!
                        </Text>
                    </Box>
                ) : (
                    <>
                        <Layout.Section>
                            <Card>
                                <Box style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                                    <>
                                        <Box>
                                            <Box style={{ display: 'flex' }}>
                                                <Text as="h1" variant="headingXl">
                                                    Good {greetings()}!&nbsp;
                                                </Text>
                                                {shopDetails?.name && <Text as="h1" variant="headingXl" style={{ display: 'none' }}>
                                                    {shopDetails.name}
                                                </Text>}
                                            </Box>
                                            <Box paddingBlockStart="100">
                                                <Text as="p" variant="bodyLg">
                                                    Welcome to the dropstock alert
                                                </Text>
                                            </Box>
                                            {shopDetails?.email && <Box paddingBlockStart="100">
                                                <Text as="p" variant="bodyLg">
                                                    Email: <strong>{shopDetails?.email}</strong>
                                                </Text>
                                            </Box>}
                                        </Box>
                                        <img
                                            src={Logo}
                                            alt="DropStock Alert"
                                            style={{ maxWidth: 120, height: 'auto', marginRight: '20px' }}
                                        />
                                    </>
                                </Box>
                            </Card>
                        </Layout.Section>
                        <Layout.Section>
                            <Card>
                                {loading ? (
                                    <Spinner accessibilityLabel="Loading" size="large" />
                                ) : (
                                    <EmptyState
                                        heading="Monitor your inventory levels and receive email alerts when stock runs low."
                                        action={{ content: 'Configuration email', url: '/app/configuration' }}
                                        secondaryAction={{
                                            content: 'Products',
                                            url: '/app/products',
                                        }}
                                        imageContained={true}
                                        image={Banner}
                                    >
                                        <>
                                            <p>Keep track of your inventory and receive email notifications when product quantities fall below your set threshold. Start with the <Button accessibilityLabel="Setup guide" url='/app/setupGuide' variant='plain'>Setup Guide</Button>
                                            </p>
                                        </>
                                    </EmptyState>
                                )}
                            </Card>
                        </Layout.Section>
                    </>
                )}
            </Layout>
        </Page>
    );
};

export default Index;
