import {forwardRef} from 'react';
import { ReactNode, CSSProperties } from "react";
import {
  Droppable as DroppableDnd,
  DroppableProvided,
  DroppableStateSnapshot,
} from "react-beautiful-dnd";

interface DroppableProps {
  children: ReactNode;
  className?: string;
  droppableId?: string;
  direction?: "horizontal" | "vertical";
  type?: "div" | "tbody";
  noStyle?: boolean;
}

const grid = 2;

const getListStyle = (isDraggingOver: boolean): CSSProperties => ({
  background: isDraggingOver ? "transparent" : "transparent",
  display: "flex",
  paddingTop: grid,
  overflow: "auto",
});

const ElementType = forwardRef((
  { type, style, provided, children }: { type: string, style: CSSProperties, provided: any, children: any },
  ref: any
) => {
  switch (type) {
    case "div":
      return (
        <div ref={ref} style={style} {...provided.droppableProps}>
          {children}
        </div>
      );
    case "tbody":
      return (
        <tbody ref={ref} style={style} {...provided.droppableProps}>
          {children}
          {provided.placeholder}
        </tbody>
      );
    default:
      return (
        <div ref={ref} style={style} {...provided.droppableProps}>
          {children}
        </div>
      );
  }
});

const Droppable: React.FC<DroppableProps> = ({
  children,
  className,
  direction = "horizontal",
  type = "div",
  ...props
}: DroppableProps) => {
  const { droppableId } = props;
  return (
    <DroppableDnd droppableId={droppableId} direction={direction}>
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
        <ElementType type={type} ref={provided.innerRef}
          style={props.noStyle ? {} : getListStyle(snapshot.isDraggingOver)}
          provided={provided}>
          {children}
        </ElementType>
      )}
    </DroppableDnd>
  );
};

export default Droppable;
