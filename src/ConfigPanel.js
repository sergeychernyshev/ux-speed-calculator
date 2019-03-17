import React from "react";

const ConfigPanel = ({ label, children }) => (
  <div className="config-panel">
    <fieldset>
      <legend>{label}</legend>
      {children}
    </fieldset>
  </div>
);

export default ConfigPanel;
