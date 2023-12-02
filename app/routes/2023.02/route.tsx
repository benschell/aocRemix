import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 2;
const slug = '2023.02';
const name = 'Day 02';

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

  let gameSum = 0,
      totalPower = 0;
  const lines = rawInput.split('\n');
  for (const line of lines) {
    console.log('line?', line);
    if (line.length === 0) {
      break;
    }

    const lineParts = line.split(':');
    const gameNum = parseInt(lineParts[0].split(' ')[1]);

    output.push(`Game #${gameNum}: ${lineParts[1]}`);

    let maxRed = 0,
        maxGreen = 0,
        maxBlue = 0;

    let gameInvalidated = false;
    const displays = lineParts[1].split(';');
    for (const display of displays) {
      const displayParts = display.split(',');
      let displayInvalidatesGame = false;
      for (const displayPart of displayParts) {
        // e.g. " 1 red", "2 green"
        const components = displayPart.trim().split(' ');
        const num = parseInt(components[0]);
        const color = components[1];
        // 12 red, 13 green, 14 blue
        if (color === 'red') {
          maxRed = Math.max(num, maxRed);
          if (num > 12) {
            displayInvalidatesGame = true;
            output.push(`Game ${gameNum} invalidated by too many reds (${num} vs 12)`);
          }
        } else if (color === 'green') {
          maxGreen = Math.max(num, maxGreen);
          if (num > 13) {
            displayInvalidatesGame = true;
            output.push(`Game ${gameNum} invalidated by too many greens (${num} vs 13)`);
          }
        } else if (color === 'blue') {
          maxBlue = Math.max(num, maxBlue);
          if (num > 14) {
            displayInvalidatesGame = true;
            output.push(`Game ${gameNum} invalidated by too many blues (${num} vs 14)`);
          }
        }

      }
      if (displayInvalidatesGame) {
        gameInvalidated = true;
      }
    }

    if (!gameInvalidated) {
      gameSum += gameNum;
    }

    const gamePower = (maxRed * maxGreen) * maxBlue;
    output.push(`Maxes: red@${maxRed} green@${maxGreen} blue@${maxBlue} = ${gamePower}`);
    output.push(`Game #${gameNum} power: ${gamePower}`);
    totalPower += gamePower;
  }
  output.unshift(`Total Power: ${totalPower}`);
  output.unshift(`Game Sum: ${gameSum}`);

  return json({ ok: true, rawInput, output: output.join('\n') });
}