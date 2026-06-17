import { Button } from "@chakra-ui/react";
import { ArrowRightIcon } from "shared/icons";
import FlowExample from "assets/images/flows-intro.png";
import { ReactComponent as FlowsIntroIcon } from "assets/icons/flows-intro.svg";
import { useFlows } from "shared/providers/FlowsContext";
import IntroLayout from "shared/components/IntroLayout/IntroLayout";

const FlowsIntro = () => {
  const { observabilityModal } = useFlows();
  return (
    <IntroLayout
      icon={FlowsIntroIcon}
      title="Introducing Flows"
      description={
        <>
          Flows are reusable bits of your platform, making it easy and
          effortless to document your system. Powered by our Radar technology.
        </>
      }
      screenshotSrc={FlowExample}
      screenshotMaxW="100%"
      screenshotAspectRatio="1202 / 648"
    >
      <Button
        mt="32px"
        rightIcon={<ArrowRightIcon />}
        onClick={observabilityModal.onOpen}
      >
        Set-up Flows
      </Button>
    </IntroLayout>
  );
};

export default FlowsIntro;
