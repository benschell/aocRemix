import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 6;
const dayStr = `${dayNum}`.padStart(2, '0');
const slug = `2023.${dayStr}`;
const name = `Day ${dayStr}`;

export async function loader({}: LoaderFunctionArgs) {
  const __dirname = getDirname();
  const inputs = await fs.readdir(`${__dirname}/../app/routes/${slug}/inputs`);
  return json({
    inputs
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: name},
    { name: "description", content: name },
  ];
};

export default function Day00() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() || {output: '', rawInput: ''};
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }} className="container mx-auto">
      <h1>{name} <Link to={`https://adventofcode.com/2023/day/${dayNum}`} className="text-lg text-blue-600 hover:underline">Puzzle</Link></h1>

      <h2>Input:</h2>
      <Form method="post" className="flex max-w-md flex-col gap-4">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="selected-input" value="Available File Inputs:" />
          </div>
          <Select name="selected-input">
            {data.inputs.map((input, index) => (
              <option key={`option-${index}`}>{input}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="raw-input" value="Raw Text Input:" />
          </div>
          <Textarea name="raw-input" placeholder="(optionally) provide raw input here" rows={4} />
        </div>
        <Button type="submit">Submit</Button>
      </Form>

      <div  className="flex max-w-4xl flex-col gap-4 mt-10">
        <h2>Output:</h2>
        <Textarea id="comment" value={actionData.output} readOnly rows={10} />
        <h3>From input:</h3>
        <Textarea id="comment" value={actionData.rawInput} readOnly rows={10} />
      </div>
    </div>
  );
}

export async function action({
  request,
}: ActionFunctionArgs) {

  const __dirname = getDirname();

  const formData = await request.formData();
  const output: string[] = [];
  let rawInput = formData.get('raw-input') as string;
  if (!rawInput) {
    // Load the indicated file
    const inputFileName = formData.get('selected-input');

    // Read the json data file data.json
    rawInput = (await fs.readFile(`${__dirname}/../app/routes/${slug}/inputs/${inputFileName}`, "utf8")) as string;
  }

  const lines = rawInput.split('\n');
  const timeParts = lines[0].split(': ');
  const distanceParts = lines[1].split(': ');
  // Part 1:
  // const times = timeParts[1].split(' ').filter((time) => time.length).map((time) => parseInt(time));
  // const distances = distanceParts[1].split(' ').filter((distance) => distance.length).map((distance) => parseInt(distance));
  // Part 2:
  const times = [parseInt(timeParts[1].replaceAll(' ', ''))];
  const distances = [parseInt(distanceParts[1].replaceAll(' ', ''))];
  output.push(`Times ${JSON.stringify(times)} and Distances ${JSON.stringify(distances)}`);

  let product = 1;
  output.push(`Races: 1-${times.length}`);
  for (let raceIdx = 0; raceIdx < times.length; raceIdx++) {
    const timeAllowed = times[raceIdx];
    const distanceToBeat = distances[raceIdx];
    let leastTimeToWin = -1;
    let mostTimeToWin = -1;
    // Find the least time to win
    for (let time = 0; time < timeAllowed-1; time++) {
      const speed = time;
      const distance = (timeAllowed - time) * speed;
      // output.push(`For Race #${raceIdx+1}, if you hold the button for ${time}ms, the boat will travel ${distance}mm`);
      if (distance > distanceToBeat) {
        output.push(`For Race #${raceIdx}, found least time to win: ${time}`);
        leastTimeToWin = time;
        break;
      }
    }
    // Find the most time to win
    for (let time = timeAllowed; time > leastTimeToWin; time--) {
      const speed = time;
      const distance = (timeAllowed - time) * speed;
      // output.push(`For Race #${raceIdx+1}, if you hold the button for ${time}ms, the boat will travel ${distance}mm`);
      if (distance > distanceToBeat) {
        output.push(`For Race #${raceIdx}, found most time to win: ${time}`);
        mostTimeToWin = time;
        break;
      }
    }
    output.push(`For Race #${raceIdx+1}, there are ${mostTimeToWin - leastTimeToWin + 1} ways to beat the record`);
    product *= (mostTimeToWin - leastTimeToWin + 1);
  }
  output.unshift(`Product: ${product}`);

  return json({ ok: true, rawInput, output: output.join('\n') });
}