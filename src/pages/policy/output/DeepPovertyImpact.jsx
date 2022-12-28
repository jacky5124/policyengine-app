import { useState } from "react";
import Plot from "react-plotly.js";
import { ChartLogo } from "../../../api/charts";
import { percent } from "../../../api/language";
import HoverCard from "../../../layout/HoverCard";
import style from "../../../style";

export default function DeepPovertyImpact(props) {
  const { impact, policyLabel } = props;
  const childPovertyChange =
    impact.poverty.deep_poverty.child.reform / impact.poverty.deep_poverty.child.baseline - 1;
  const adultPovertyChange =
    impact.poverty.deep_poverty.adult.reform / impact.poverty.deep_poverty.adult.baseline - 1;
  const seniorPovertyChange =
    impact.poverty.deep_poverty.senior.reform / impact.poverty.deep_poverty.senior.baseline - 1;
  const totalPovertyChange =
    impact.poverty.deep_poverty.all.reform / impact.poverty.deep_poverty.all.baseline - 1;
  const povertyChanges = [
    childPovertyChange,
    adultPovertyChange,
    seniorPovertyChange,
    totalPovertyChange,
  ];
  const povertyLabels = ["Children", "Working-age adults", "Seniors", "All"];
  const labelToKey = {
    Children: "child",
    "Working-age adults": "adult",
    Seniors: "senior",
    All: "all",
  }
  const [hovercard, setHoverCard] = useState(null);
  // Decile bar chart. Bars are grey if negative, green if positive.
  const chart = (
    <Plot
      data={[
        {
          x: povertyLabels,
          y: povertyChanges,
          type: "bar",
          marker: {
            color: povertyChanges.map((value) =>
              value < 0 ? style.colors.DARK_GREEN : style.colors.DARK_GRAY
            ),
          },
          text: povertyChanges.map(
            (value) =>
              (value >= 0 ? "+" : "") +
              (value * 100).toFixed(1).toString() +
              "%"
          ),
          textangle: 0,
          hoverinfo: "none",
        },
      ]}
      layout={{
        xaxis: {
          title: "Age group",
        },
        yaxis: {
          title: "Relative change",
          tickformat: "+,.1%",
        },
        showlegend: false,
        uniformtext: {
          mode: "hide",
          minsize: 8,
        },
        ...ChartLogo,
      }}
      config={{
        displayModeBar: false,
        responsive: true,
      }}
      style={{
        width: "100%",
      }}
      onHover={(data) => {
        const group = data.points[0].x;
        const change = data.points[0].y;
        const baseline = impact.poverty.deep_poverty[labelToKey[group]].baseline;
        const reform = impact.poverty.deep_poverty[labelToKey[group]].reform;
        const message =
          `The percentage of ${
            group === "All" ? 
              "people" : 
              group.toLowerCase()
          } in absolute deep poverty before housing costs ${
            change < -0.001 ? 
              `falls ${percent(-change)} from ${percent(baseline)} to ${percent(reform)}.` : 
              change > 0.001 ?
                `rises ${percent(change)} from ${percent(baseline)} to ${percent(reform)}.` :
                `remains at ${percent(baseline)}.`
          }`;
        setHoverCard({
          title: group,
          body: message,
        });
      }}
    />
  );

  const povertyRateChange = percent(Math.abs(totalPovertyChange));

  return (
    <>
      <h2>
        {policyLabel}{" "}
        {totalPovertyChange > 0
          ? `raises the deep poverty rate by ${povertyRateChange}`
          : totalPovertyChange < 0
          ? `reduces the deep poverty rate by ${povertyRateChange}`
          : "doesn't change the deep poverty rate"}
      </h2>
      <p>
        The chart below shows the relative change in the deep poverty rate for each
        age group.
      </p>
      <HoverCard
        content={hovercard}
      >
        {chart}
      </HoverCard>
    </>
  );
}
