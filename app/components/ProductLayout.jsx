import { Card, FullscreenBar, Icon, Layout, Page, Text, Tooltip } from '@shopify/polaris'
import React from 'react'
import { InfoIcon } from '@shopify/polaris-icons';


const ProductLayout = ({ title, children, navigateAction, tooltipContent }) => {
    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <FullscreenBar onAction={navigateAction}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Text variant="headingLg">{title}</Text>
                                {tooltipContent && (
                                    <Tooltip content={tooltipContent}>
                                        <Icon source={InfoIcon} />
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </FullscreenBar>
                </Layout.Section>
                <Layout.Section>
                    <Card>
                        {children}
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    )
}
export default ProductLayout