"use client";

import React from "react";
import BayesSequenceWidget from "./BayesSequenceWidget";

type Props = {
  title?: string;
  highlightSurprisals?: boolean;
};

const BayesSequenceLogWidget: React.FC<Props> = ({
  title = "Bayes Sequence Explorer (Log Space)",
  highlightSurprisals = false
}) => {
  return (
    <BayesSequenceWidget 
      title={title}
      logSpace={true}
      highlightSurprisals={highlightSurprisals}
    />
  );
};

export default BayesSequenceLogWidget;