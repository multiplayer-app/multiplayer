import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDisclosure } from "@chakra-ui/react";

import {
  ProFeatureModal,
  TrialExpiredModal,
} from "shared/components/BillingModals";
import * as WorkspaceService from "shared/services/workspace.service";
import { useAnalytics } from "shared/providers/AnalyticsContext";
import { PostHogEvents, SubscriptionType } from "shared/models/enums";
import { getSubscriptionTypeName } from "shared/utils";

const BillingContext = createContext<{
  showProFeaturePopup: () => void;
  setAccountInfo: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  portalUrl: string;
  currentSubscription: any;
  getCurrentSubscription: (workspaceId: string) => Promise<void>;
  subscriptionType: string;
  setSubscriptionType: React.Dispatch<React.SetStateAction<SubscriptionType>>;
}>(null);

export const BillingProvider = ({ children }) => {
  const proFeatureDisclosure = useDisclosure();
  const trialEndedDisclosure = useDisclosure();
  const [currentSubscription, setCurrentSubscription] = useState<any>({});
  const [portalUrl, setPortalUrl] = useState<string>(null);
  const [subscriptionType, setSubscriptionType] =
    useState<SubscriptionType>(null);
  const [accountInfo, setAccountInfo] = useState({
    accountId: null,
    workspaceId: null,
  });
  const { trackEvent } = useAnalytics();

  const trialModalKey = useMemo(
    () =>
      accountInfo?.accountId && accountInfo?.workspaceId
        ? accountInfo?.accountId +
          accountInfo?.workspaceId +
          "trialModalDismissed"
        : null,
    [accountInfo]
  );

  const trialModalKeyRef = useRef(trialModalKey);

  useEffect(() => {
    trialModalKeyRef.current = trialModalKey;
  }, [trialModalKey]);

  const getCurrentSubscription = useCallback(async (workspaceId) => {
    // if(process.env.NODE_ENV === 'development') return

    try {
      trialEndedDisclosure.onClose();
      const [res, portal] = await Promise.all([
        WorkspaceService.getWorkspaceBilling(workspaceId),
        WorkspaceService.getWorkspaceCustomerPortalUrl(workspaceId),
      ]);

      setCurrentSubscription(res);
      setPortalUrl(portal.url);
      const subscriptionName = getSubscriptionTypeName(res?.productName);
      setSubscriptionType(subscriptionName);
      checkCurrentSubscription(res);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const checkCurrentSubscription = useCallback(
    (subscription) => {
      if (!trialModalKeyRef.current) {
        setTimeout(() => {
          checkCurrentSubscription(subscription);
        }, 300);
        return;
      }

      if (
        trialModalKeyRef.current &&
        localStorage.getItem(trialModalKeyRef.current)
      ) {
        trialEndedDisclosure.onClose();
        return;
      }

      // if (
      //   subscription.productId === config.REACT_APP_STRIPE_FREE_PRODUCT_ID
      // ) {
      //   trialEndedDisclosure.onOpen();
      // }
    },
    [trialModalKeyRef]
  );

  const showProFeaturePopup = () => {
    proFeatureDisclosure.onOpen();
  };

  const onContact = () => {
    trackEvent(PostHogEvents.USER_CLICKED_TO_DEMO_LINK, {});
  };

  const onBenefitCheck = () => {
    trackEvent(PostHogEvents.USER_CHECKED_PRO_PLAN_BENEFITS, {});
  };

  return (
    <BillingContext.Provider
      value={{
        portalUrl,
        subscriptionType,
        currentSubscription,
        showProFeaturePopup,
        setAccountInfo,
        getCurrentSubscription,
        setSubscriptionType,
      }}
    >
      <ProFeatureModal
        disclosure={proFeatureDisclosure}
        onContact={onContact}
        onBenefitCheck={onBenefitCheck}
      />
      <TrialExpiredModal
        disclosure={trialEndedDisclosure}
        trialModalKey={trialModalKey}
        onContact={onContact}
        onBenefitCheck={onBenefitCheck}
      />
      {children}
    </BillingContext.Provider>
  );
};

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === null) {
    throw new Error("useBillingContext must be used within BillingProvider");
  }
  return context;
}
