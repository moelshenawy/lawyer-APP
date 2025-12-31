import React, { useState } from "react";

const FilePreview = ({ url }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (!url) return null;

  const isPDF = /\.pdf(\?.*)?$/i.test(url);

  // PDFs: iframe
  if (isPDF) {
    return (
      <div className="file-preview">
        <iframe className="file-preview__frame" src={url} title="File Preview" frameBorder="0" />
      </div>
    );
  }

  // Try image first, fallback to iframe on error
  if (!imgFailed) {
    return (
      <div className="file-preview">
        <img
          className="file-preview__img"
          src={url}
          alt="File Preview"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="file-preview">
      <iframe className="file-preview__frame" src={url} title="File Preview" frameBorder="0" />
    </div>
  );
};

export default FilePreview;
