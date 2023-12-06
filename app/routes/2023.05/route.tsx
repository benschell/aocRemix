import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 5;
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
  
  const maps = rawInput.split('\n\n');

  // Part 1 seeds:
  let startTime = Date.now();
  const seeds = maps[0].split(':')[1].trim().split(' ').map((seedStr) => parseInt(seedStr));
  // const seedSummaries: string[] = [];
  // const seeds: {[key: string]: any}[] = maps[0].split(':')[1].trim().split(' ').map((seedStr) => ({seed: parseInt(seedStr), summary: `Seed ${seedStr}`}));

  // Part 2 seeds:
  // console.log('Will compute seeds:', maps[0]);
  // const seedRanges = maps[0].split(':')[1].trim().split(' ');
  // const seeds: {[key: string]: any}[] = [];
  // for (let i = 0; i < seedRanges.length; i += 2) {
  //   const rangeStart = parseInt(seedRanges[i]);
  //   const rangeLength = parseInt(seedRanges[i+1]);
  //   for (let j = rangeStart; j < rangeStart + rangeLength; j++) {
  //     seeds.push({
  //       seed: j,
  //       summary: `Seed ${j}`
  //     });
  //   }
  // }
  console.log(`Computed seeds: ${seeds.map((seed) => ` ${seed}`)}`);
  

  let lowestLocation = Number.MAX_SAFE_INTEGER;
  const computeSeed = (source: number, seedIdx: number) => {
    let currentTitle: string = 'seed';
    // seedSummaries[seedIdx] = `Seed ${source}`;

    for (let mapIdx = 1; mapIdx < maps.length; mapIdx++) {
      let destination = -1;

      const rawMap = maps[mapIdx];
      const lines = rawMap.split('\n');
      const titleParts = lines[0].split(' ')[0].split('-');
      const sourceTitle = titleParts[0];
      const destinationTitle = titleParts[2];

      // output.push(`Assessing map: ${sourceTitle}-to-${destinationTitle} (last title: ${currentTitle})`);

      if (sourceTitle !== currentTitle) {
        console.log(`ERROR: DID NOT FIND EXPECTED MAP: ${sourceTitle} vs. ${currentTitle}`);
        break;
      }

      // Transform each seed obj based on this map
      for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
        const lineParts = lines[lineIdx].split(' ');
        const destinationRangeStart = parseInt(lineParts[0]);
        const sourceRangeStart = parseInt(lineParts[1]);
        const rangeLength = parseInt(lineParts[2]);

        if (source >= sourceRangeStart && source < sourceRangeStart + rangeLength) {
          // Found a source range that matches. Compute destination
          destination = source - sourceRangeStart + destinationRangeStart;
        }
      }
      if (destination === -1) {
        destination = source;
      }

      // seedSummaries[seedIdx] += `, ${destinationTitle} ${destination}`;

      // Prepare for next round
      currentTitle = destinationTitle;
      source = destination;
    }

    lowestLocation = Math.min(lowestLocation, source);
  }
  // Part 1: 
  output.push(`Iterating over seeds: ${seeds}`);
  for (let seedIdx = 0; seedIdx < seeds.length; seedIdx++) {
    computeSeed(seeds[seedIdx], seedIdx);
  }
  output.unshift(`Part 1: Lowest Location: ${lowestLocation}`);
  output.unshift(`Compute time: ${Date.now() - startTime}ms`);
  // Part 1: 2ms

  startTime = Date.now();
  lowestLocation = Number.MAX_SAFE_INTEGER;
  
  // Part 2: original impl too slow
  const rounds = [];
  for (let mapIdx = 1; mapIdx < maps.length; mapIdx++) {
    let destination = -1;

    const rawMap = maps[mapIdx];
    const lines = rawMap.split('\n');

    // Determine the set of possible operations
    const possibilities = [];
    for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
      const lineParts = lines[lineIdx].split(' ');
      const destinationRangeStart = parseInt(lineParts[0]);
      const sourceRangeStart = parseInt(lineParts[1]);
      const rangeLength = parseInt(lineParts[2]);
      possibilities.push({
        gte: sourceRangeStart,
        lt: sourceRangeStart + rangeLength,
        mod: sourceRangeStart - destinationRangeStart,
      });
    }
    rounds.push(possibilities);
  }

  for (let seedIdx = 0; seedIdx < seeds.length; seedIdx+=2) {
    let initialSeedNum = seeds[seedIdx];
    let seedNumRange = seeds[seedIdx+1]
    for (let i = initialSeedNum; i < initialSeedNum + seedNumRange; i++) {
      let seedNum = i;
      if (seedNum % 100000000 === 0) {
        console.log(`Processing seed #${seedNum}`);
      }
      // Transform the seedNum!
      for (const round of rounds) {
        let mod = 0;
        for (const possibility of round) {
          if (seedNum >= possibility.gte && seedNum < possibility.lt) {
            mod = possibility.mod;
            break;
          }
        }
        seedNum -= mod;
      }
      lowestLocation = Math.min(lowestLocation, seedNum);
    }
  }



  output.unshift(`Part 2: Lowest Location: ${lowestLocation}`);
  // correct answer: 77435348
  // 404626ms
  output.unshift(`Compute time: ${Date.now() - startTime}ms`);



  return json({ ok: true, rawInput, output: output.join('\n') });
}