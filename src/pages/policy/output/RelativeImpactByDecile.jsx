import { useContext } from "react";
import Plot from "react-plotly.js";
import { ChartLogo } from "../../../api/charts";
import { formatVariableValue } from "../../../api/variables";
import style from "../../../style";
import HoverCard, {HoverCardContext} from "../../../layout/HoverCard";
import { cardinal, percent } from "../../../api/language";
import useMobile from "../../../layout/Responsive";
import DownloadableScreenshottable from "./DownloadableScreenshottable";
import DownloadCsvButton from './DownloadCsvButton';
import { avgChangeDirection, plotLayoutFont } from './utils';
import React, { useRef } from "react";

export default function RelativeImpactByDecile(props) {
  const { impact, policyLabel, metadata, preparingForScreenshot } = props;
  const mobile = useMobile();

  function RelativeImpactByDecilePlot() {
    const {setContent, setCoordinates} = useContext(HoverCardContext);

    const dataHandler = (data) => {
      const point = data.points[0];
      const relativeChange = point.y;
      const plotLeft = point.xaxis.d2p(point.x);
      const left = plotLeft + point.xaxis._offset;
      const top = point.yaxis.d2p(relativeChange) + point.yaxis._offset;
      if (plotLeft <= point.xaxis._length / 2) {
        setCoordinates(left, top, relativeChange >= 0 ? "bottom-left" : "top-left");
      } else {
        setCoordinates(left, top, relativeChange >= 0 ? "bottom-right" : "top-right");
      }
      const decile = cardinal(point.x);
      const message =
        relativeChange > 0.001
          ? `This reform would raise the income of households in the ${decile} decile by an average of ${percent(
            relativeChange
          )}.`
          : relativeChange < -0.001
            ? `This reform would lower the income of households in the ${decile} decile by an average of ${percent(
              -relativeChange
            )}.`
            : relativeChange === 0
              ? `This reform would not impact the income of households in the ${decile} decile.`
              : (relativeChange > 0 ? "This reform would raise " : "This reform would lower ") +
              ` the income of households in the ${decile} decile by less than 0.1%.`;
      setContent({
        title: `Decile ${point.x}`,
        body: message,
      });
    };

    // Decile bar chart. Bars are grey if negative, green if positive.
    return (
      <Plot
        data={[
          {
            x: Object.keys(impact.decile.relative),
            y: Object.values(impact.decile.relative),
            type: "bar",
            marker: {
              color: Object.values(impact.decile.relative).map((value) =>
                value < 0 ? style.colors.DARK_GRAY : style.colors.DARK_GREEN
              ),
            },
            text: Object.values(impact.decile.relative).map(
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
            title: "Income decile",
            tickvals: Object.keys(impact.decile.relative),
          },
          yaxis: {
            title: "Relative change",
            tickformat: "+,.0%",
          },
          uniformtext: {
            mode: "hide",
            minsize: 8,
          },
          showlegend: false,
          ...ChartLogo(mobile ? 0.97 : 0.97, mobile ? -0.25 : -0.15),
          margin: {
            t: 0,
            b: 80,
            r: 20,
            l: 60,
          },
          height: mobile ? 300 : 500,
          ...plotLayoutFont
        }}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
        style={{
          width: "100%",
          marginBottom: !mobile && 50,
        }}
        onClick={dataHandler}
        onHover={dataHandler}
        onUnhover={() => {
          setContent(null);
        }}
      />
    );
  }

  const averageRelChange =
    -impact.budget.budgetary_impact / impact.budget.baseline_net_income;
  
  const urlParams = new URLSearchParams(window.location.search);
  const region = urlParams.get("region");
  const options = metadata.economy_options.region.map((region) => {
    return { value: region.name, label: region.label };
  });
  const label =
  region === "us" || region === "uk"
    ? ""
    : "in " + options.find((option) => option.value === region)?.label;
  const screenshotRef = useRef();
  const csvHeader = ['Income Decile', 'Relative Change'];
  const data = [
    csvHeader,
    ...Object.entries(impact.decile.relative).map(([decile, relativeChange]) => {
      return [decile, relativeChange];
    }),
  ];
  const downloadButtonStyle = {
    position: "absolute",
    bottom: "40px",
    left: "55px",
  };  
    
  return (
    <>
      <DownloadableScreenshottable ref={screenshotRef}>
        <h2 style={{ width: '700px', wordWrap: 'break-word' }}>
          {`${policyLabel} ${avgChangeDirection(averageRelChange)} the net income of households ${label} by ${
            formatVariableValue({ unit: "/1" }, Math.abs(averageRelChange), 1)} on average`}
        </h2>
        <HoverCard>
          <RelativeImpactByDecilePlot/>
        </HoverCard>
      </DownloadableScreenshottable>
        <div className="chart-container">
          {!mobile && (
            <DownloadCsvButton preparingForScreenshot={preparingForScreenshot}
              content={data}
              filename={`relativeImpactByDecile${policyLabel}.csv`}
              style={downloadButtonStyle}
            />
          )}
        </div>
      <p>
        The chart above shows the relative change in income for each income
        decile. Households are sorted into ten equally-populated groups
        according to their equivalised household net income.
      </p>
    </>
  );
}
