import pluralize from "pluralize";

const Pluralize = ({ singular, count }) => {
  const plural = pluralize(singular, count);
  return <>{count} {plural}</>;
};

export default Pluralize;
