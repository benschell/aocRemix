import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 9;
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

  // Discovery: 
  // Found that, in general, just need to compute last two 0s
  const printVals = (allVals: number[][]) => {
    const strs = [];
    for (let round = 0; round < allVals.length; round++) {
      let str = '';
      for (let i = 0; i < (round - 1) * 3; i += 3) {
        str += '   ';
      }
      str += allVals[round].join('   ');
      strs.push(str);
    }
    output.push(`Vals:\n${strs.join('\n')}`);
  };
  // lines.forEach((line) => {
  //   if (!line.length) {
  //     return;
  //   }
  //   let vals = line.split(' ').map((part) => parseInt(part));
  //   const allVals = [vals];

  //   while (true) {
  //     if (vals.filter((num) => num !== 0).length === 0) {
  //       // Have all zeros
  //       break;
  //     }
  //     const newVals = [];
  //     for (let valIdx = 0; valIdx < vals.length-1; valIdx++) {
  //       newVals.push(vals[valIdx+1] - vals[valIdx]);
  //     }
  //     vals = newVals;
  //     allVals.push(vals);
  //   }
  //   printVals(allVals);
  // })

  let sum = 0;
  let partTwoSum = 0;
  lines.forEach((line) => {
    if (!line.length) {
      return;
    }

    const vals = line.split(' ').map((part) => parseInt(part)).reverse();
    let diffs: number[][] = [vals];
    // Try different depths to see how many we have to compute to get to 0
    let depth = 0;
    while (true) {
      depth += 1;
      for(let curDepth = 1; curDepth <= depth; curDepth++) {
        // Make sure we have enough diffs at each depth
        // If we're trying out depth 2, then we need
        // 3 at depth 1 and 2 at depth 2.
        // If we're trying out depth 3, then we need
        // 4 at depth 1, 3 at depth 2, and 2 at depth 3
        const expectedCount = depth - curDepth + 1;

        if (!diffs[curDepth]) {
          diffs[curDepth] = [];
        }
        const currDepthArr = diffs[curDepth];
    
        if (currDepthArr.length < expectedCount) {
          // We need to compute another diff at this depth
          // Take the difference of the last two from the prior depth
          const priorDepthArr = diffs[curDepth-1];
          const right = priorDepthArr[currDepthArr.length];
          const left = priorDepthArr[currDepthArr.length+1];
          const diff = right - left;
          currDepthArr.push(diff);
          console.log(`Grown! Now ${currDepthArr.length} < ${expectedCount}?`);
        }
        console.log(`Filled ${curDepth}, going deeper`);
      }

      // Compute one more round of diffs
      // TODO:
      if (diffs[depth].length < 2) {
        for(let curDepth = 1; curDepth <= depth; curDepth++) {
          const currDepthArr = diffs[curDepth];
          
          const priorDepthArr = diffs[curDepth-1];
          const right = priorDepthArr[currDepthArr.length];
          const left = priorDepthArr[currDepthArr.length+1];
          const diff = right - left;
          currDepthArr.push(diff);
        }
      }

      // Determine if we have a set of 2 0s
      console.log(`Inspecting: ${JSON.stringify(diffs[depth])}`);
      const allZeros = diffs[depth].filter((diff) => diff === 0).length === 2;

      if (allZeros) {
        // Compute the next value in the original series using this depth
        let nextVal = 0;
        for (let i = depth; i >= 0; i--) {
          console.log(`Pulling up diff: ${i}, ${JSON.stringify(diffs)}}`);
          output.push(`Adding ${diffs[i][0]} and ${nextVal}`);
          nextVal = diffs[i][0] + nextVal;
        }
        output.push(`Next Val: ${nextVal}`);
        sum += nextVal;
        printVals(diffs);
        break;
      }

      if (diffs[depth].length > 3) {
        break;
      }
    }

    // Now that we've found the proper depth, we can figure out Part 2 by executing the same logic at the other end of the arr
    let partTwoDiffs: number[][] = [vals.reverse()];
    // Try different depths to see how many we have to compute to get to 0
    let partTwoDepth = 0;
    while (partTwoDepth < depth) {
      partTwoDepth += 1;
      for(let curDepth = 1; curDepth <= partTwoDepth; curDepth++) {
        // Make sure we have enough diffs at each depth
        // If we're trying out depth 2, then we need
        // 3 at depth 1 and 2 at depth 2.
        // If we're trying out depth 3, then we need
        // 4 at depth 1, 3 at depth 2, and 2 at depth 3
        const expectedCount = partTwoDepth - curDepth + 1;

        if (!partTwoDiffs[curDepth]) {
          partTwoDiffs[curDepth] = [];
        }
        const currDepthArr = partTwoDiffs[curDepth];
    
        if (currDepthArr.length < expectedCount) {
          // We need to compute another diff at this depth
          // Take the difference of the last two from the prior depth
          const priorDepthArr = partTwoDiffs[curDepth-1];
          const left = priorDepthArr[currDepthArr.length];
          const right = priorDepthArr[currDepthArr.length+1];
          const diff = right - left;
          currDepthArr.push(diff);
          console.log(`Part 2: Grown! Now ${currDepthArr.length} < ${expectedCount}?`);
        }
        console.log(`Part 2: Filled ${curDepth}, going deeper`);
      }
    }
    console.log(`Part 2: Inspecting:`);
    // Compute the next value in the original series using this depth
    let nextVal = 0;
    for (let i = depth; i >= 0; i--) {
      console.log(`Pulling up diff: ${i}, ${JSON.stringify(partTwoDiffs)}}`);
      output.push(`Adding ${partTwoDiffs[i][0]} and ${nextVal}`);
      nextVal = partTwoDiffs[i][0] - nextVal;
    }
    output.push(`Part 2: Next Val: ${nextVal}`);
    partTwoSum += nextVal;
    printVals(partTwoDiffs);
  });
  output.unshift(`Computed total: ${sum}`);
  // 1969959013 is too high
  // 1969958987 is correct


  output.unshift(`Part 2: Computed total: ${partTwoSum}`);
  // 1068 is correct

  return json({ ok: true, rawInput, output: output.join('\n') });
}