// Decide which Replicate endpoint to hit and how to format the body
export function resolveReplicateEndpoint(
  modelId: string,
  input: Record<string, unknown>,
) {
  const ownerName = modelId.match(/^([^/]+)\/([^:]+)$/);
  const isVersionHash = /^[a-f0-9]{64}$/i.test(modelId);
  const hasOwnerNameVersion = modelId.includes(":");
  const useModelsEndpoint =
    !!ownerName && !hasOwnerNameVersion && !isVersionHash;

  if (useModelsEndpoint) {
    const url = `https://api.replicate.com/v1/models/${ownerName![1]}/${ownerName![2]}/predictions`;
    return { url, body: JSON.stringify({ input }) };
  }
  // Otherwise use unified predictions with "version"
  const url = "https://api.replicate.com/v1/predictions";
  return { url, body: JSON.stringify({ version: modelId, input }) };
}
