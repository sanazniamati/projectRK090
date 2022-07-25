import React, { useState } from "react";
import { Stage, Layer, Image, Transformer, Circle, Line } from "react-konva";
import useImage from "use-image";

const URLImage = ({
  image,
  shapeProps,
  unSelectShape,
  isSelected,
  onSelect,
  onChange,
  stageScale,
  onDelete
}) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();
  const deleteButton = React.useRef();
  const [img] = useImage(image.src);

  React.useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      //TODO:batchDraw()
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const onMouseEnter = (event) => {
    if (isSelected) {
      event.target.getStage().container().style.cursor = "move";
    }
    if (!isSelected) {
      event.target.getStage().container().style.cursor = "pointer";
    }
  };

  const onMouseLeave = (event) => {
    event.target.getStage().container().style.cursor = "default";
  };

  const handleDelete = () => {
    unSelectShape(null);
    onDelete(shapeRef.current);
  };

  return (
    <React.Fragment>
      <Image
        image={img}
        x={image.x}
        y={image.y}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        // I will use offset to set origin to the center of the image
        offsetX={img ? img.width / 2 : 0}
        offsetY={img ? img.height / 2 : 0}
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y()
          });
        }}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            // set minimal value
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY)
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        >
          <Circle
            radius={8}
            fill="red"
            ref={deleteButton}
            onClick={handleDelete}
            x={shapeRef.current.width() * stageScale}
          ></Circle>
        </Transformer>
      )}
    </React.Fragment>
  );
};

const DragandDrop = () => {
  const dragUrl = React.useRef();
  const stageRef = React.useRef();
  const [images, setImages] = React.useState([]);
  const [selectedId, setSelectShape] = React.useState(null);
  // const stage = stageRef.current?.getStage();
  const [stageSpec, setStageSpec] = useState({
    scale: 1,
    x: 0,
    y: 0
  });
  const handleWheel = (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageSpec({
      scale: newScale,
      x: (stage.getPointerPosition().x / newScale - mousePointTo.x) * newScale,
      y: (stage.getPointerPosition().y / newScale - mousePointTo.y) * newScale
    });
  };

  const handleRemove = (index) => {
    const newList = images.filter((item) => item.index !== index);

    setImages(newList);
  };

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectShape(null);
    }
  };

  const unSelectShape = (prop) => {
    setSelectShape(prop);
  };

  const onDeleteImage = (node) => {
    const newImages = [...images];
    newImages.splice(node.index, 1);
    setImages(newImages);
  };

  return (
    <div>
      <div>
        <div>
          <div>
            <div>
              <div className="justify-content-center">
                <h4>Try to drag an image into the stage:</h4>
              </div>
            </div>
            <div>
              <div>
                <img
                  height="50rem"
                  width="50rem"
                  objectfit="contain"
                  key="img3"
                  alt="Rotary Pump - Grinder"
                  src="./RotaryPump-Grinder.png"
                  draggable="true"
                  onDragStart={(e) => {
                    dragUrl.current = e.target.src;
                  }}
                />
              </div>
            </div>
          </div>
          <div
            onDrop={(e) => {
              e.preventDefault();
              // register event position
              stageRef.current.setPointersPositions(e);
              // add image
              setImages(
                images.concat([
                  {
                    ...stageRef.current.getRelativePointerPosition(),
                    src: dragUrl.current
                  }
                ])
              );
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {console.log("images =", images)}
            <Stage
              width={window.innerWidth * 0.97}
              height={window.innerHeight * 0.5}
              onMouseDown={checkDeselect}
              onTouchStart={checkDeselect}
              style={{
                border: "1px solid grey"
              }}
              ref={stageRef}
              draggable="true"
              scaleX={stageSpec.scale}
              scaleY={stageSpec.scale}
              x={stageSpec.x}
              y={stageSpec.y}
              onWheel={handleWheel}
            >
              <Layer>
                {images.map((image, index) => {
                  return (
                    <URLImage
                      image={image}
                      key={index}
                      shapeProps={image}
                      stageScale={stageSpec.scale}
                      isSelected={image === selectedId}
                      unSelectShape={unSelectShape}
                      onClick={handleRemove}
                      onSelect={() => {
                        setSelectShape(image);
                      }}
                      onChange={(newAttrs) => {
                        const rects = images.slice();
                        rects[index] = newAttrs;
                        setImages(rects);
                      }}
                      onDelete={onDeleteImage}
                    />
                  );
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragandDrop;
