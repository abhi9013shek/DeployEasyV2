export interface K8sResourceNames {
  deploymentName: string;
  serviceName: string;
  ingressName: string;
  hostName: string;
}

export function sanitizeResourceName(name: string): string {
  // Convert to lowercase, replace non-alphanumeric chars with hyphens
  let sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!sanitized) {
    sanitized = 'app';
  }

  // Ensure DNS label compliance (max 63 chars)
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50).replace(/-$/, '');
  }

  return sanitized;
}

export function generateK8sResourceNames(projectName: string): K8sResourceNames {
  const base = sanitizeResourceName(projectName);
  return {
    deploymentName: `${base}-dep`,
    serviceName: `${base}-svc`,
    ingressName: `${base}-ing`,
    hostName: `${base}.localhost`,
  };
}

export class KubernetesManifestGenerator {
  static generateDeploymentManifest(
    names: K8sResourceNames,
    imageTag: string,
    containerPort: number
  ): object {
    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: names.deploymentName,
        labels: {
          app: names.deploymentName,
          'managed-by': 'deployeasy',
          target: 'aws',
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: names.deploymentName,
          },
        },
        template: {
          metadata: {
            labels: {
              app: names.deploymentName,
            },
          },
          spec: {
            containers: [
              {
                name: names.deploymentName,
                image: imageTag,
                imagePullPolicy: 'Always',
                ports: [
                  {
                    containerPort: containerPort,
                  },
                ],
              },
            ],
          },
        },
      },
    };
  }

  static generateServiceManifest(
    names: K8sResourceNames,
    containerPort: number
  ): object {
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: names.serviceName,
        labels: {
          app: names.deploymentName,
          'managed-by': 'deployeasy',
          target: 'aws',
        },
      },
      spec: {
        type: 'LoadBalancer',
        selector: {
          app: names.deploymentName,
        },
        ports: [
          {
            port: containerPort,
            targetPort: containerPort,
            protocol: 'TCP',
          },
        ],
      },
    };
  }

  static generateIngressManifest(
    names: K8sResourceNames,
    containerPort: number
  ): object {
    return {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: names.ingressName,
        labels: {
          app: names.deploymentName,
          'managed-by': 'deployeasy',
        },
        annotations: {
          'nginx.ingress.kubernetes.io/ssl-redirect': 'false',
        },
      },
      spec: {
        rules: [
          {
            host: names.hostName,
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: names.serviceName,
                      port: {
                        number: containerPort,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };
  }
}
