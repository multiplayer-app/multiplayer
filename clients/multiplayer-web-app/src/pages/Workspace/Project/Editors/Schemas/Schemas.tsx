const Schemas = () => {
  // const wrapper = useRef();
  // const { tabId } = useParams();
  // const { data, state, actions } = useDiagramBoard();
  //
  // useEffect(() => {
  //   const data = getData(tabId);
  //   actions.setState(data);
  // }, [tabId, actions]);
  //
  // useEffect(() => {
  //   updateData(tabId, { nodes: state.nodes, edges: state.edges });
  // }, [tabId, state.nodes, state.edges]);
  //
  // return (
  //   <div className="schemas-diagram-wrapper" ref={wrapper}>
  //     <CodeEditor value={code} extension="java" />
  //     <DiagramBoard data={data} state={state} actions={actions} path={tabId} />
  //   </div>
  // );
  return null;
};

const code = `//// -- LEVEL 1
//// -- Tables and References

// Creating tables
Table users as U {
  id int [pk, increment] // auto-increment
  full_name varchar
  created_at timestamp
  country_code int
}

Table countries {
  code int [pk]
  name varchar
  continent_name varchar
 }

// Creating references
// You can also define relaionship separately
// > many-to-one; < one-to-many; - one-to-one
Ref: U.country_code > countries.code
Ref: merchants.country_code > countries.code

//-------------------------------------------//

//// -- LEVEL 2
//// -- Adding column settings

Table order_items {
  order_id int [ref: > orders.id] // inline relationship (many-to-one)
  product_id int
  quantity int [default: 1] // default value
}

Ref: order_items.product_id > products.id

Table orders {
  id int [pk] // primary key
  user_id int [not null, unique]
  status varchar
  created_at varchar [note: 'When order created'] // add column note
}
`;

export default Schemas;
