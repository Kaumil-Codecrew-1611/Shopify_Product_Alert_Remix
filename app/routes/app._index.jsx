import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  Page,
  Text,
  TextField,
  Frame,
  Toast
} from "@shopify/polaris";
import { useEffect, useState, useCallback } from "react";
import prisma from '../server/db.server.js';
import { apiVersion, authenticate } from "../shopify.server";
import axiosInstance from "../server/axios.js";
import cron from 'node-cron';

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
    const filteredData = await data.products.filter(item => (item.handle !== "gift-card") && item.variants.some(node => node.inventory_quantity < emailConfig.threshold)).map(item => ({ ...item, variants: item.variants.filter(node => node.inventory_quantity < emailConfig.threshold) }));

    const shop_information = {
      shop_id: shopDetails.shop.id,
      shop_name: shopDetails.shop.name,
      shop_url: shopDetails.shop.domain,
      email: emailConfig.email,
    };
    const response = await axiosInstance.post("/store-product", { shop_information, productData: filteredData });
    const changeTimeResponse = await axiosInstance.post("/change-time", { set_minute: emailConfig.frequency, shop_information });
    console.log(changeTimeResponse, " ------------changeTimeResponse");
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
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const formData = await request.formData();
  const email = formData.get("email");
  const threshold = parseInt(formData.get("threshold"));
  const frequency = parseInt(formData.get("frequency"));
  await prisma.emailConfiguration.upsert({
    where: { shop },
    create: {
      email, threshold, frequency, shop
    },
    update: {
      email, threshold, frequency, shop
    },
  });
  return json({ message: "Form submitted successfully!", email, threshold, frequency });
};

export default function Index() {
  const data = useLoaderData();
  const [formDataSaved, setFormDataSaved] = useState({});
  const [toastActive, setToastActive] = useState(false);

  useEffect(() => { data?.emailConfig && setFormDataSaved(data?.emailConfig) }, [data]);

  const toggleToastActive = useCallback(() => setToastActive((active) => !active), []);
  
  const validateForm = (event) => {
    event.preventDefault();
    const { email, threshold, frequency } = formDataSaved;
    if (!email || !threshold || !frequency) {
      setToastActive(true);
    } else {
      document.getElementById("configForm").submit();
    }
  };

  const toastMarkup = toastActive ? (
    <Toast content="Please fill out all fields before submitting the form." error onDismiss={toggleToastActive} />
  ) : null;

  return (
    <Frame>
      {toastMarkup}
      <Page title="Setting Configuration">
        <BlockStack gap={{ xs: "800", sm: "400" }}>
          <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
            <Box
              as="section"
              paddingInlineStart={{ xs: "400", sm: "0" }}
              paddingInlineEnd={{ xs: "400", sm: "0" }}
            >
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Configurations
                </Text>
                <Text as="p" variant="bodyMd">
                  Update App Setting and Preferences
                </Text>
              </BlockStack>
            </Box>
            <Card roundedAbove="sm">
              <Form method="post" id="configForm" onSubmit={validateForm}>
                <BlockStack gap="400">
                  <TextField
                    label="Email"
                    name="email"
                    value={formDataSaved?.email || ""}
                    onChange={(value) =>
                      setFormDataSaved({ ...formDataSaved, email: value })
                    }
                  />
                  <TextField
                    label="Threshold"
                    name="threshold"
                    value={formDataSaved?.threshold || ""}
                    onChange={(value) =>
                      setFormDataSaved({ ...formDataSaved, threshold: value })
                    }
                  />
                  <TextField
                    label="Frequency"
                    name="frequency"
                    value={formDataSaved?.frequency || ""}
                    onChange={(value) =>
                      setFormDataSaved({ ...formDataSaved, frequency: value })
                    }
                  />
                  <Button submit={true}>{data && data?.emailConfig ? 'Edit' : 'Save'}</Button>
                </BlockStack>
              </Form>
            </Card>
          </InlineGrid>
        </BlockStack>
      </Page>
    </Frame>
  );
}
