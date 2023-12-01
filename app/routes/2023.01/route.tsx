import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 1;
const slug = '2023.01';
const name = 'Day 01';

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

  let sum = 0;
  for(let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    if (line.length === 0) {
      continue;
    }
    let firstNum = null,
        firstNumIndex = -1,
        lastNum = null,
        lastNumIndex = -1,
        textNums: {[key: string]: number} = {
          'one': 1,
          'two': 2,
          'three': 3,
          'four': 4,
          'five': 5,
          'six': 6,
          'seven': 7,
          'eight': 8,
          'nine': 9
        },
        textNumEarliestIndex = Number.MAX_SAFE_INTEGER,
        textNumEarliest: number = -1,
        textNumLatestIndex = -1,
        textNumLatest = -1;
    Object.keys(textNums).forEach((textNum) => {
      const idx = line.indexOf(textNum);
      const lastIdx = line.lastIndexOf(textNum);
      if (idx > -1) {
        if (idx < textNumEarliestIndex) {
          textNumEarliestIndex = idx;
          textNumEarliest = textNums[textNum];
        }
        if (lastIdx > textNumLatestIndex) {
          textNumLatestIndex = lastIdx;
          textNumLatest = textNums[textNum];
        }
      }
    });
    for(let charNum = 0; charNum < line.length; charNum++) {
      const num = parseInt(line[charNum]);
      if (!isNaN(num)) {
        firstNum = num;
        firstNumIndex = charNum;
        break;
      }
    }
    for(let charNum = line.length-1; charNum >= 0; charNum--) {
      const num = parseInt(line[charNum]);
      if (!isNaN(num)) {
        lastNum = num;
        lastNumIndex = charNum;
        break;
      }
    }
    if (!firstNum || textNumEarliestIndex < firstNumIndex) {
      firstNum = textNumEarliest;
      firstNumIndex = textNumEarliestIndex;
    }
    if (!lastNum || textNumLatestIndex > lastNumIndex) {
      lastNum = textNumLatest;
      lastNumIndex = textNumLatestIndex;
    }
    let num = parseInt(`${firstNum}${lastNum}`);
    output.push(`Found nums: ${firstNum}${lastNum} = ${num} for ${line}`);
    sum += num;
  }
  output.unshift(`Ans: ${sum}`);
  // Part 1:
  // 54338 was correct
  // Part 2:
  // 53424 was too high
  // 50184 was too low
  // 53389 was correct

  return json({ ok: true, rawInput, output: output.join('\n') });
}