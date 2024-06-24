import { useLoaderData } from '@remix-run/react';
import { Box, Card, EmptyState, Layout, Page, Text, Spinner } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import { apiVersion, authenticate } from '../shopify.server';
import prisma from '../server/db.server';
import axios from 'axios';

/* export const loader = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);
        const { shop, accessToken } = session;
        console.log(accessToken,"::::accessToken")
        const responseOfShop = await fetch(`https://${shop}/admin/api/${apiVersion}/shop.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });
        const shopDetails = await responseOfShop.json();
        console.log(shopDetails, "shopDetails");
        return { shopDetails };
    } catch (error) {
        console.log(error, "ErrorResponse");
        return { error: error.message };
    }
};
 */
const clientId = process.env.SHOPIFY_API_KEY;
const clientSecret = process.env.SHOPIFY_API_SECRET;

async function exchangeToken(shop, subjectToken) {
    const url = `https://${shop}.myshopify.com/admin/oauth/access_token`;

    const params = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token: subjectToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
        requested_token_type: 'urn:shopify:params:oauth:token-type:offline-access-token',
    };

    try {
        const response = await axios.post(url, params);
        return response.data;
    } catch (error) {
        console.error('Error exchanging token:', error);
        throw new Error('Token exchange failed');
    }
}
export const loader = async ({ request }) => {
    try {

        const { session } = await authenticate.admin(request);
        console.log(session, "----session----")
        exchangeToken(session.shop, session.accessToken)
            .then(data => console.log('Token Exchange Successful:', data))
            .catch(error => console.error('Token Exchange Failed:', error));

        if (!session) {
            // Handle case where session is null or undefined
            await prisma.session.deleteMany()
            throw new Error('Authentication Failed!');
        }

        const { shop, accessToken } = session;
        console.log(accessToken, "::::accessToken");

        const responseOfShop = await fetch(`https://${shop}/admin/api/${apiVersion}/shop.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });

        if (!responseOfShop.ok) {
            // Handle case where fetching shop details fails
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
                                                    Welcome to the alert application
                                                </Text>
                                            </Box>
                                            {shopDetails?.email && <Box paddingBlockStart="100">
                                                <Text as="p" variant="bodyLg">
                                                    Email: <strong>{shopDetails?.email}</strong>
                                                </Text>
                                            </Box>}
                                        </Box>
                                        <img
                                            src="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
                                            alt="Online store dashboard"
                                            style={{ maxWidth: 100, height: 'auto', marginRight: '20px' }}
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
                                        image="https://codecrewinfotech.com/images/logos/logo-cc.png"
                                    >
                                        <p>Keep track of your inventory and get notified via email when product quantities fall below your set threshold.</p>
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
