"use client";

import React from "react";
import BayesSequenceWidget from "./BayesSequenceWidget";

type Props = {
  title?: string;
};

const BayesSequenceLogWidget: React.FC<Props> = ({
  title = "Bayes Sequence Explorer (Log Space)"
}) => {
  return (
    <BayesSequenceWidget 
      title={title}
      logSpace={true}
    />
  );
};

export default BayesSequenceLogWidget;