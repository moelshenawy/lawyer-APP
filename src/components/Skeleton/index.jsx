import React, { useMemo } from "react";
import styles from "./index.module.scss";

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

function Base({
  as: Tag = "div",
  width,
  height,
  radius = 8,
  animation = "wave", // 'wave' | 'pulse' | 'none'
  className = "",
  style,
  circle = false,
  ...rest
}) {
  const inlineStyle = {
    width,
    height,
    borderRadius: circle ? "50%" : typeof radius === "number" ? `${radius}px` : radius,
    ...(style || {}),
  };
  const animClass =
    animation === "none" ? styles.none : animation === "pulse" ? styles.pulse : styles.wave;

  return (
    <Tag className={`${styles.skeleton} ${animClass} ${className}`} style={inlineStyle} {...rest} />
  );
}

const Skeleton = ({
  variant: variantProp = "rect", // 'rect' | 'text' | 'title' | 'circle' | 'button' | 'image' | 'avatar' | 'chip' | 'line'
  type, // legacy alias
  width,
  height,
  size,
  lines = 3,
  lineHeight = 14,
  gap = 8,
  randomize = true,
  aspectRatio, // e.g. '16/9' | '1' | 1.5
  radius = 10,
  animation = "wave",
  count = 1,
  className = "",
  style,
  as,
}) => {
  // Backward-compat: map legacy `type` to `variant`
  const mapType = (t) => {
    if (!t) return undefined;
    if (t === "box" || t === "rect") return "rect";
    if (t === "text" || t === "line") return "text";
    if (t === "circle" || t === "avatar") return "circle";
    if (t === "button") return "button";
    if (t === "image") return "image";
    return t;
  };
  const variant = mapType(variantProp) || mapType(type) || "rect";
  // Normalize sizes by variant
  const resolved = useMemo(() => {
    switch (variant) {
      case "circle":
      case "avatar": {
        const sz = size || width || height || 40;
        return { width: sz, height: sz, circle: true, radius: sz / 2 };
      }
      case "button": {
        return {
          width: width || size || 120,
          height: height || 40,
          radius: radius ?? 10,
        };
      }
      case "chip": {
        return {
          width: width || size || 80,
          height: height || 28,
          radius: 9999,
        };
      }
      case "image": {
        return {
          width: width || "100%",
          height: height,
          aspectRatio: aspectRatio || (height ? undefined : "16/9"),
          radius: radius ?? 12,
        };
      }
      case "title": {
        return { width: width || "60%", height: height || 22, radius: radius ?? 8 };
      }
      case "line":
      case "text":
      case "rect":
      default:
        return { width: width || "100%", height: height || 16, radius };
    }
  }, [variant, width, height, size, aspectRatio, radius]);

  const makeTextLines = () => {
    const n = clamp(lines, 1, 12);
    const baseWidths = Array.from({ length: n }, (_, i) => {
      if (!randomize) return 100;
      const min = i === n - 1 ? 50 : 80; // last line shorter
      const max = 100;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    });
    return (
      <div className={styles.textGroup} style={{ gap }} aria-hidden>
        {baseWidths.map((w, i) => (
          <Base
            key={i}
            width={
              typeof resolved.width === "number" ? `${resolved.width}px` : resolved.width || "100%"
            }
            height={lineHeight}
            radius={4}
            className={styles.line}
            animation={animation}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    );
  };

  const makeOne = (key) => {
    if (variant === "text") return <React.Fragment key={key}>{makeTextLines()}</React.Fragment>;
    if (variant === "title")
      return (
        <Base
          key={key}
          width={resolved.width}
          height={resolved.height}
          radius={resolved.radius}
          animation={animation}
          className={`${styles.title} ${className}`}
        />
      );
    if (variant === "image")
      return (
        <Base
          key={key}
          width={resolved.width}
          height={resolved.height}
          radius={resolved.radius}
          animation={animation}
          className={`${styles.block} ${className}`}
          style={{ ...(style || {}), aspectRatio: resolved.aspectRatio }}
        />
      );
    if (variant === "button")
      return (
        <Base
          key={key}
          width={resolved.width}
          height={resolved.height}
          radius={resolved.radius}
          animation={animation}
          className={`${styles.block} ${styles.button} ${className}`}
          style={style}
        />
      );
    if (variant === "chip")
      return (
        <Base
          key={key}
          width={resolved.width}
          height={resolved.height}
          radius={resolved.radius}
          animation={animation}
          className={`${styles.block} ${styles.chip} ${className}`}
          style={style}
        />
      );
    if (variant === "circle" || variant === "avatar")
      return (
        <Base
          key={key}
          width={resolved.width}
          height={resolved.height}
          radius={resolved.radius}
          animation={animation}
          className={`${styles.block} ${className}`}
          circle
          style={style}
        />
      );
    // rect or line (generic)
    return (
      <Base
        key={key}
        width={resolved.width || width}
        height={resolved.height || height}
        radius={resolved.radius}
        animation={animation}
        className={`${styles.block} ${className}`}
        as={as}
        style={style}
      />
    );
  };

  if (count > 1) {
    return <>{Array.from({ length: count }).map((_, i) => makeOne(i))}</>;
  }

  return makeOne(0);
};

// Convenience sub components
Skeleton.Text = (props) => <Skeleton variant="text" {...props} />;
Skeleton.Title = (props) => <Skeleton variant="title" {...props} />;
Skeleton.Rect = (props) => <Skeleton variant="rect" {...props} />;
Skeleton.Button = (props) => <Skeleton variant="button" {...props} />;
Skeleton.Image = (props) => <Skeleton variant="image" {...props} />;
Skeleton.Circle = (props) => <Skeleton variant="circle" {...props} />;
Skeleton.Avatar = (props) => <Skeleton variant="avatar" {...props} />;
Skeleton.Chip = (props) => <Skeleton variant="chip" {...props} />;

export default Skeleton;
