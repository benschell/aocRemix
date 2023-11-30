import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 1;
const slug = '2022.01';
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

  // Given the rawInput, solve the problem!
  const lines = rawInput.split('\n');
  const elfPacks = [];
  let currentPack = 0;
  for (let lineNum = 0; lineNum < lines.length + 1; lineNum++) {
    console.log('Line:', lineNum, lines.length);
    if (lineNum == lines.length || lines[lineNum] === '') {
      // empty line, move to next elf!
      elfPacks.push({index: elfPacks.length, calories: currentPack});
      currentPack = 0;
    } else {
      currentPack += Number(lines[lineNum]);
    }
  }
  elfPacks.sort((a, b) => {
    return b.calories - a.calories;
  });

  // Part 1:
  output.push(`Most calories (Part 1): ${elfPacks[0].calories}\n`);

  // Part 2:
  output.push(`Top 3 sum: ${elfPacks[0].calories + elfPacks[1].calories + elfPacks[2].calories}`)

  output.push(`Packs: ${JSON.stringify(elfPacks, null, '\t')}`);

  return json({ ok: true, rawInput, output: output.join('\n') });
}