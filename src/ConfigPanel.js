import React from "react";

const ConfigPanel = ({ label, children }) => (
  <fieldset>
    <legend>{label}</legend>
    {children}
  </fieldset>
);

export default ConfigPanel;
