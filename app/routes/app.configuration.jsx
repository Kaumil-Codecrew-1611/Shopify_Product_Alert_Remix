import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import {
    Button,
    Card,
    Frame,
    Grid,
    Layout,
    Page,
    Select,
    Text,
    TextField,
    Toast,
    Tooltip
} from "@shopify/polaris";
import cron from "node-cron";
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../server/axios.js";
import prisma from "../server/db.server.js";
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
        console.log(shopDetails, "::::shopDetails")

        const responseOfProduct = await fetch(`https://${shop}/admin/api/${apiVersion}/products.json`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken,
            }
        });

        const data = await responseOfProduct.json();
        const filteredData = await data.products.filter(item => (item.handle !== "gift-card") && item.variants.some(node => node.inventory_quantity < emailConfig.threshold)).map(item => ({ ...item, variants: item.variants.filter(node => node.inventory_quantity < emailConfig.threshold) }));
        const shop_information = {
            shop_id: shopDetails.shop.id,
            shop_name: shopDetails.shop.name,
            shop_url: shopDetails.shop.domain,
            email: emailConfig.email,
            shop_owner: shopDetails?.shop_owner
        };
        const response = await axiosInstance.post("/store-product", { shop_information, productData: filteredData });
        await axiosInstance.post("/change-time", { set_minute: emailConfig.frequency, set_unit: emailConfig.frequencyUnit, shop_information });
        return response;
    } catch (error) {
        console.log({ error: error.response.data }, "Error sending details");
    }
};

export const loader = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);
        const { shop, accessToken } = session;
        const emailConfig = await prisma.emailConfiguration.findFirst({ where: { shop } });
        if (emailConfig) {
            cron.schedule('* * * * *', async () => {
                await sendProducts(shop, accessToken, emailConfig);
            });
        }
        return ({ shop, emailConfig });
    } catch (error) {
        console.log(error, "ThisIsError");
        return null;
    }
};


export const action = async ({ request }) => {
    try {
        const { session } = await authenticate.admin(request);
        const { shop } = session;
        const formData = await request.formData();
        const email = formData.get("email");
        const threshold = parseInt(formData.get("threshold"));
        const frequency = parseInt(formData.get("frequency")); // Ensure frequency is parsed correctly
        const frequencyUnit = formData.get("frequencyUnit");

        console.log({ email, threshold, frequency, frequencyUnit }, "Received form data");

        await prisma.emailConfiguration.upsert({
            where: { shop },
            create: {
                email, threshold, frequency, frequencyUnit, shop
            },
            update: {
                email, threshold, frequency, frequencyUnit, shop
            },
        });

        return json({ message: "Form submitted successfully!", email, threshold, frequency, frequencyUnit });
    } catch (error) {
        console.error("Error storing form data in Prisma:", error);
        return json({ error: "An error occurred while processing the form." }, 500);
    }
};


const getMaxFrequency = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Get the last day of the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return {
        minute: 60 * 24 * daysInMonth, // Maximum minutes in the current month
        hour: 24 * daysInMonth,        // Maximum hours in the current month
        day: daysInMonth,              // Maximum days in the current month
        week: Math.ceil(daysInMonth / 7) // Maximum weeks in the current month
    };
};
export default function Index() {
    const data = useLoaderData();
    const [formDataSaved, setFormDataSaved] = useState({});
    const [toastActive, setToastActive] = useState(false);
    const [toastContent, setToastContent] = useState("");
    const [errors, setErrors] = useState({});
    const maxFrequency = getMaxFrequency();

    useEffect(() => {
        if (data?.emailConfig) {
            setFormDataSaved(data.emailConfig);
        }
    }, [data]);

    console.log(formDataSaved, ":::::formDataSaved");

    const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);

    const handleFormChange = useCallback(
        (field) => (value) => {
            setFormDataSaved((prev) => ({ ...prev, [field]: value }));
            if (errors[field]) {
                setErrors((prev) => ({ ...prev, [field]: '' }));
            }
        },
        [errors]
    );

    const validateForm = (event) => {
        event.preventDefault();
        const { email, threshold, frequency, frequencyUnit } = formDataSaved;
        const newErrors = {};

        if (!email) {
            newErrors.email = "Email is required.";
        }
        if (!threshold) {
            newErrors.threshold = "Threshold is required.";
        }
        if (!frequency) {
            newErrors.frequency = "Frequency is required.";
        } else if (frequency > maxFrequency[frequencyUnit]) {
            newErrors.frequency = `Maximum allowable value for ${frequencyUnit} is ${maxFrequency[frequencyUnit]}.`;
        }
        if (!frequencyUnit) {
            newErrors.frequencyUnit = "Frequency unit is required.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setToastContent("Please fix the errors in the form.");
            setToastActive(true);
        } else {
            document.getElementById("configForm").submit();
        }
    };

    const toastMarkup = toastActive ? (
        <Toast content={toastContent} error onDismiss={toggleToastActive} />
    ) : null;

    return (
        <Frame>
            {toastMarkup}

            <Page title="Setting Configuration">
                <Layout>
                    <Layout.Section oneThird>
                        <Card
                            as="section"
                            paddingInlineStart={{ xs: "400", sm: "0" }}
                            paddingInlineEnd={{ xs: "400", sm: "0" }}
                        >
                            <Text as="h3" variant="headingMd">
                                Configurations
                            </Text>
                            <Text as="p" variant="bodyMd">
                                Update App Setting and Preferences
                            </Text>
                        </Card>
                    </Layout.Section>
                    <Layout.Section twoThirds>
                        <Card roundedAbove="sm">
                            <Form method="post" id="configForm" onSubmit={validateForm}>
                                <Grid >
                                    <Grid.Cell columnSpan={{ xs: 12, sm: 6, md: 6, lg: 6, xl: 6 }}>
                                        <Tooltip content="Enter the email address where you want to receive product details notifications.">
                                            <TextField
                                                label="Email"
                                                name="email"
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
                                                                { label: "Please select", value: "", disabled: true },
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



        </Frame>
    );
}