import { Box, Card, Layout, Page, Text } from '@shopify/polaris'
import React from 'react'

const Index = () => {
    const greetings = () => {
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 12) {
            return 'Morning';
        } else if (currentHour >= 12 && currentHour < 18) {
            return 'Afternoon';
        } else {
            return 'Evening';
        }
    }
    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <Card>
                        <Box style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Box style={{ display: 'flex' }}>
                                    <Text as="h1" variant="heading2xl">
                                        Good {greetings()}!&nbsp;
                                    </Text>
                                    <Text as="h1" variant="heading2xl">
                                        Meet node
                                    </Text>
                                </Box>
                                <Box paddingBlockStart="100">
                                    <Text as="p" variant="bodyLg">
                                        Welcome to the alert application
                                    </Text>
                                </Box>
                                <Box paddingBlockStart="100">
                                    <Text as="p" variant="bodyLg">
                                        Email: <strong>meetnode@gmail.com</strong>
                                    </Text>
                                </Box>
                            </Box>
                            <img
                                src="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
                                alt="Online store dashboard"
                                style={{ maxWidth: 100, height: 'auto', marginRight: '20px' }}
                            />
                        </Box>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}

export default Index