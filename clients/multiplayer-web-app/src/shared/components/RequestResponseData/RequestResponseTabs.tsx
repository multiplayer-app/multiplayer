import { useState } from "react";
import { Stack } from "@chakra-ui/react";
import JSONView from "shared/components/JSONView";
import SwitchButtons from "shared/components/SwitchButtons";
import NoDataPage from "shared/components/NoDataPage";
import SessionNoData from "assets/images/emptyStates/SystemCatalog-Sessions.png";

enum RequestResponseOptionEnum {
  Body = "body",
  Header = "header",
}

const options = [
  {
    tooltip: "Body",
    command: "B",
    value: RequestResponseOptionEnum.Body,
    label: "Body",
  },
  {
    tooltip: "Header",
    command: "H",
    value: RequestResponseOptionEnum.Header,
    label: "Header",
  },
];

const RequestResponseData = ({ body, headers }) => {
  const [currentView, setCurrentView] = useState(
    RequestResponseOptionEnum.Body
  );

  return (
    <Stack gap={2} flex="1" flexDirection="column" minH="0">
      <SwitchButtons
        value={currentView}
        options={options}
        onChange={setCurrentView}
        hideLabel={false}
        size="xl"
      />
      {currentView === RequestResponseOptionEnum.Body ? (
        body ? (
          <JSONView data={body} searchable={true} />
        ) : (
          <NoDataPage imageSrc={SessionNoData} />
        )
      ) : headers ? (
        <JSONView data={headers} searchable={true} />
      ) : (
        <NoDataPage imageSrc={SessionNoData} />
      )}
    </Stack>
  );
};

export default RequestResponseData;
