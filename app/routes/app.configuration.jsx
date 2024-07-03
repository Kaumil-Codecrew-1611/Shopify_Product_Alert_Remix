import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import {
    Button,
    Card,
    FullscreenBar,
    Grid,
    Layout,
    Page,
    Select,
    Text,
    TextField,
    Tooltip
} from "@shopify/polaris";
import cron from "node-cron";
import { useCallback, useEffect, useState } from "react";
import prisma from "../server/db.server.js";

import axiosInstance from "../server/axios.js";
import { apiVersion, authenticate } from "../shopify.server";
const sendProducts = async (shop, accessToken, emailConfig) => {
    try {
        const responseOfShop = await fetch(`https://${shop}/admin/api/${apiVersion}/shop.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });
        const shopDetails = await responseOfShop.json();

        const responseOfProduct = await fetch(`https://${shop}/admin/api/${apiVersion}/products.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });

        const data = await responseOfProduct.json();
        const filteredData = data.products.filter(item => (item.handle !== "gift-card") && item.variants.some(node => node.inventory_quantity < emailConfig.threshold)).map(item => ({ ...item, variants: item.variants.filter(node => node.inventory_quantity < emailConfig.threshold) }));
        let shop_information = {
            shop_id: shopDetails.shop.id,
            shop_name: shopDetails.shop.name,
            shop_url: shopDetails.shop.domain,
            email: emailConfig.email,
            shop_owner: shopDetails.shop_owner ? shopDetails.shop_owner : "",
            frequency: emailConfig.frequency,
            unit: emailConfig.frequencyUnit
        };
        await axiosInstance.post("/store-product", { shop_information, productData: filteredData });

        return true;
    } catch (error) {
    }
};
const sendProductsInEachMinute = async (shop, accessToken, emailConfig) => {
    try {
        const responseOfShop = await fetch(`https://${shop}/admin/api/${apiVersion}/shop.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });
        const shopDetails = await responseOfShop.json();

        const responseOfProduct = await fetch(`https://${shop}/admin/api/${apiVersion}/products.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });

        const data = await responseOfProduct.json();
        const filteredData = data.products.filter(item => (item.handle !== "gift-card") && item.variants.some(node => node.inventory_quantity < emailConfig.threshold)).map(item => ({ ...item, variants: item.variants.filter(node => node.inventory_quantity < emailConfig.threshold) }));

        let shop_information1 = {
            shop_id: shopDetails.shop.id,
            shop_name: shopDetails.shop.name,
            shop_url: shopDetails.shop.domain,
            email: emailConfig.email,
            shop_owner: shopDetails.shop_owner ? shopDetails.shop_owner : "User",
            frequency: emailConfig.frequency,
            unit: emailConfig.frequencyUnit
        };
        await axiosInstance.post("/store-product", { shop_information: shop_information1, productData: filteredData });
        return true;

    } catch (error) {
    }
};

export const loader = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);
        const { shop, accessToken } = session;
        const emailConfig = await prisma.emailConfiguration.findFirst({ where: { shop } });
        if (emailConfig) {
            cron.schedule('* * * * *', async () => {
                setTimeout(async () => {
                    await sendProductsInEachMinute(shop, accessToken, emailConfig);
                }, 4000)
            });
        }
        return ({ shop, emailConfig });
    } catch (error) {
        return null;
    }
};
export const action = async ({ request }) => {
    let settings = await request.formData();

    settings = Object.fromEntries(settings);

    const maxFrequency = getMaxFrequency();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    let newErrors = {};

    if (!settings.email) {
        newErrors.email = "Email is required.";
    }
    if (!emailRegex.test(settings.email)) {
        newErrors.emailValid = "Email is not valid.";
    }

    if (!settings.threshold) {
        newErrors.threshold = "Threshold is required.";
    } else if (isNaN(settings.threshold)) {
        newErrors.threshold = "Threshold must be a number.";
    }

    if (!settings.frequency) {
        newErrors.frequency = "Frequency is required.";
    } else if (isNaN(settings.frequency)) {
        newErrors.frequency = "Frequency must be a number.";
    } else if (settings.frequencyUnit && settings.frequency > maxFrequency[settings.frequencyUnit]) {
        newErrors.frequency = `Maximum allowable value for ${settings.frequencyUnit} is ${maxFrequency[settings.frequencyUnit]}.`;
    }

    if (!settings.frequencyUnit) {
        newErrors.frequencyUnit = "Frequency unit is required.";
    }

    if (Object.keys(newErrors).length > 0) {
        return json({ errors: newErrors }, { status: 400 });
    }

    const { session } = await authenticate.admin(request);
    let emailConfig = {
        threshold: +settings.threshold,
        email: settings.email,
        frequency: +settings.frequency,
        frequencyUnit: settings.frequencyUnit
    }

    try {
        await prisma.emailConfiguration.upsert({
            where: { shop: session.shop },
            create: {
                email: settings.email,
                threshold: +settings.threshold,
                frequency: +settings.frequency,
                frequencyUnit: settings.frequencyUnit,
                shop: session.shop,
            },
            update: {
                email: settings.email,
                threshold: +settings.threshold,
                frequency: +settings.frequency,
                frequencyUnit: settings.frequencyUnit,
                shop: session.shop,
            },
        });
        sendProducts(session.shop, session.accessToken, emailConfig, true)
        return json({ message: "Form submitted successfully!" });
    } catch (error) {
        return json({ message: "An error occurred while saving the configuration." }, { status: 500 });
    }
};


const getMaxFrequency = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return {
        minute: 60 * 24 * daysInMonth,
        hour: 24 * daysInMonth,
        day: daysInMonth,
        week: Math.ceil(daysInMonth / 7)
    };
};
export default function Index() {
    const data = useLoaderData();
    const actionsResult = useActionData();
    const [formDataSaved, setFormDataSaved] = useState({});
    const [errors, setErrors] = useState({});
    const navigate = useNavigate()
    useEffect(() => {
        if (data?.emailConfig) {
            setFormDataSaved(data.emailConfig);
        }
    }, [data]);

    useEffect(() => {
        if (actionsResult) {
            if (actionsResult.errors) {
                shopify.toast.show(Object.values(actionsResult.errors)[0], { isError: true })
            } else if (actionsResult.message) {
                shopify.toast.show(actionsResult.message)
            }
        }
    }, [actionsResult]);

    const handleFormChange = useCallback(
        (field) => (value) => {
            setFormDataSaved((prev) => ({ ...prev, [field]: value }));
            if (errors[field]) {
                setErrors((prev) => ({ ...prev, [field]: '' }));
            }
        },
        [errors]
    );

    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <FullscreenBar onAction={() => navigate('/app')}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Text variant="headingLg">Email configuration</Text>
                            </div>
                        </div>
                    </FullscreenBar>
                </Layout.Section>
                <Layout.Section oneThird>
                    <Card
                        as="section"
                        paddingInlineStart={{ xs: "400", sm: "0" }}
                        paddingInlineEnd={{ xs: "400", sm: "0" }}
                    >
                        <div style={{ display: "flex", flexBasis: "row", justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Text as="h3" variant="headingMd">
                                    Configurations
                                </Text>
                                <Text as="p" variant="bodyMd">
                                    Update app setting and preferences
                                </Text>
                            </div>
                            <div>
                                {/* <Button tone="critical" onClick={(e) => activeMails(e, false)} variant="primary">Disable mails</Button> */}
                            </div>
                        </div>
                    </Card>
                </Layout.Section>
                <Layout.Section twoThirds>
                    <Card roundedAbove="sm">
                        {/* <Form method="post" id="configForm" onSubmit={validateForm}> */}
                        <Form method="POST">
                            <Grid >
                                <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                    <Tooltip content="Enter the email address where you want to receive product details notifications.">
                                        <TextField
                                            label="Email"
                                            name="email"
                                            autoComplete="off"
                                            placeholder="support@example.com"
                                            value={formDataSaved?.email || ""}
                                            onChange={handleFormChange("email")}
                                            error={errors.email}
                                        />
                                    </Tooltip>
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                    <Tooltip content="Enter a value. If a product's quantity falls below this value, you will receive an email notification.">
                                        <TextField
                                            label="Threshold"
                                            name="threshold"
                                            type="number"
                                            autoComplete="off"
                                            placeholder="e.g. 5"
                                            value={formDataSaved?.threshold || ""}
                                            onChange={handleFormChange("threshold")}
                                            error={errors.threshold}
                                        />
                                    </Tooltip>
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
                                    <Tooltip content="Specify how frequently you want to receive email notifications for the products (e.g., minute-based, hourly-based, or weekly-based). For example, enter 2 for 2 weeks or 5 for 5 hours. Ensure the frequency is less than one month.">
                                        <TextField
                                            label="Frequency"
                                            name="frequency"
                                            type="number"
                                            autoComplete="off"
                                            placeholder="e.g. 1"
                                            value={formDataSaved?.frequency || ""}
                                            onChange={handleFormChange("frequency")}
                                            error={errors.frequency}
                                            connectedRight={
                                                <Tooltip content="Select the unit for notification frequency.">
                                                    <Select
                                                        label="Frequency Unit"
                                                        labelHidden
                                                        name="frequencyUnit"
                                                        options={[
                                                            { label: "Minutes", value: "minute" },
                                                            { label: "Hours", value: "hour" },
                                                            { label: "Days", value: "day" },
                                                            { label: "Weeks", value: "week" },
                                                        ]}
                                                        value={formDataSaved?.frequencyUnit || ""}
                                                        onChange={handleFormChange("frequencyUnit")}
                                                        error={errors.frequencyUnit}
                                                    />
                                                </Tooltip>
                                            }
                                        />
                                    </Tooltip>
                                </Grid.Cell>
                                <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 3, lg: 3, xl: 3 }}>
                                    <Button fullWidth size="large" submit={true}>{data && data?.emailConfig ? "Edit" : "Save"} configurations</Button>
                                </Grid.Cell>
                            </Grid>
                        </Form>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}