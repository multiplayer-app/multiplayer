import { useMemo } from "react";
import { Button, Flex, Icon, Link, Text } from "@chakra-ui/react";
import {
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
} from "@multiplayer/types";
import {
  EnterprisePlanIcon,
  FreePlanIcon,
  ProPlanIcon,
  StarsFilledIcon,
} from "shared/icons";
import { useBilling } from "shared/providers/BillingContext";
import PageLoading from "shared/components/PageLoading";
import CheckAccess from "shared/components/CheckAccess";
import { isObjectEmpty } from "shared/utils";
import { PostHogEvents, SubscriptionType } from "shared/models/enums";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { Content, NARROW_CONTENT_PROPS } from "../../SettingsLayout";

const PlanIcons = {
  [SubscriptionType.free]: FreePlanIcon,
  [SubscriptionType.teams]: ProPlanIcon,
  [SubscriptionType.enterprise]: EnterprisePlanIcon,
};

const Billing = () => {
  const { currentSubscription, portalUrl } = useBilling();
  const { trackEvent } = useAnalytics();

  const subscriptionDetails = useMemo(() => {
    const {
      productName,
      trialRemainingDays,
      freeTrial,
      subscriptionInterval,
      unitAmount,
      unitQuantity,
      cancelAtPeriodEnd,
      currentPeriodEnd,
    } = currentSubscription;

    const pricingDetails = unitAmount
      ? `${unitAmount / 100}$ per member per ${subscriptionInterval}`
      : "";

    return {
      type: productName?.split(" ")[1].toLowerCase(),
      productNameAndTrial: freeTrial
        ? `${productName} (Free Trial, ${trialRemainingDays} day${
            trialRemainingDays > 1 ? "s" : ""
          } remaining)`
        : productName,
      intervalAndQuantity: `${subscriptionInterval}ly x ${unitQuantity} member${
        unitQuantity > 1 ? "s" : ""
      }`,
      priceAndRenewal: `${pricingDetails && pricingDetails + ","} ${
        cancelAtPeriodEnd ? "expires" : "renews"
      } at ${new Date(currentPeriodEnd).toDateString()}.`,
    };
  }, [currentSubscription]);

  const onCheckBenefits = () => {
    trackEvent(PostHogEvents.USER_CHECKED_PRO_PLAN_BENEFITS, {});
  };

  const isHostedPlan = subscriptionDetails.type !== SubscriptionType.free;

  return (
    <Content title="Billing" contentProps={NARROW_CONTENT_PROPS}>
      {isObjectEmpty(currentSubscription) ? (
        <PageLoading />
      ) : (
        <Flex
          key="subscription-plan"
          direction="column"
          border="0.5px solid"
          borderRadius="16px"
          borderColor="border.secondary"
          bg="bg.subtle"
          p="4"
          gap="2"
        >
          <Flex gap="2" alignItems="center">
            <Flex p="2" bg="bg.primary" borderRadius="md">
              <Icon as={PlanIcons[subscriptionDetails.type] || FreePlanIcon} />
            </Flex>
            <Text fontWeight="500">
              {subscriptionDetails.productNameAndTrial}
            </Text>
          </Flex>
          <Flex color="muted" direction="column" py="2">
            <Text fontSize="sm" textTransform="capitalize">
              {subscriptionDetails.intervalAndQuantity}
            </Text>
            <Text fontSize="sm">{subscriptionDetails.priceAndRenewal}</Text>
          </Flex>
          <CheckAccess
            entity={RoleWorkspacePermissionEntity.WORKSPACE}
            permission={RoleAccessAction.BILLING_UPDATE}
          >
            <Flex gap="2" justifyContent="center">
              <Button
                as={Link}
                target="_blank"
                rel="noreferrer"
                href={portalUrl}
                _hover={{ textDecoration: "none" }}
              >
                {isHostedPlan ? "Manage your subscription" : "Upgrade"}
              </Button>
              <Button
                as={Link}
                target="_blank"
                rel="noreferrer"
                variant="light"
                _hover={{ textDecoration: "none" }}
                href="https://cal.com/multiplayer/30min"
                leftIcon={<StarsFilledIcon />}
              >
                Chat with our team
              </Button>
            </Flex>
            <Button
              as={Link}
              alignSelf="center"
              variant="link"
              color="muted"
              target="_blank"
              rel="noreferrer"
              onClick={onCheckBenefits}
              href="https://www.multiplayer.app/pricing"
              _hover={{ textDecoration: "none" }}
            >
              See all the benefits of our paid plans
            </Button>
          </CheckAccess>
        </Flex>
      )}
    </Content>
  );
};

export default Billing;
